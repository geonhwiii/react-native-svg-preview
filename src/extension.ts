import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('React Native SVG Preview 확장 프로그램이 활성화되었습니다!');
    
    // 테스트 명령 등록
    const testCommand = vscode.commands.registerCommand('react-native-svg-preview.test', () => {
        vscode.window.showInformationMessage('확장 프로그램이 작동합니다!');
    });
    
    // SVG 미리보기 명령 등록
    const previewCommand = vscode.commands.registerCommand('react-native-svg-preview.previewSvg', async (uri?: vscode.Uri) => {
        // 현재 활성 에디터에서 URI 가져오기
        if (!uri && vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }
        
        if (!uri) {
            vscode.window.showErrorMessage('파일을 선택해주세요.');
            return;
        }
        
        try {
            // 파일 내용 읽기
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            
            // SVG 컴포넌트 추출
            const svgComponents = extractSvgComponents(content);
            
            if (svgComponents.length === 0) {
                vscode.window.showInformationMessage('이 파일에서 React Native SVG 컴포넌트를 찾을 수 없습니다.');
                return;
            }
            
            vscode.window.showInformationMessage(`${svgComponents.length}개의 SVG 컴포넌트를 찾았습니다!`);
            
            // 웹뷰 패널 생성
            const panel = vscode.window.createWebviewPanel(
                'svgPreview',
                `SVG Preview - ${uri.fsPath.split('/').pop()}`,
                vscode.ViewColumn.Two,
                {
                    enableScripts: true
                }
            );
            
            // SVG 컴포넌트들을 HTML로 변환
            panel.webview.html = getWebviewContent(svgComponents, uri.fsPath);
            
        } catch (error) {
            vscode.window.showErrorMessage(`오류가 발생했습니다: ${error}`);
        }
    });
    
    context.subscriptions.push(testCommand, previewCommand);
}

function extractSvgComponents(content: string): Array<{type: string, props: any, content?: string}> {
    const components: Array<{type: string, props: any, content?: string}> = [];
    
    // React Native SVG 컴포넌트들 찾기
    const svgPattern = /<(Svg|Circle|Rect|Path|G|Line|Polygon|Polyline|Text|Ellipse|Defs|Use|Image|ClipPath|Mask)[^>]*(?:\/>|>[\s\S]*?<\/\1>)/gi;
    
    let match;
    while ((match = svgPattern.exec(content)) !== null) {
        const fullMatch = match[0];
        const componentType = match[1];
        
        // props 추출
        const props = extractProps(fullMatch);
        
        // 내용 추출 (self-closing이 아닌 경우)
        let innerContent = '';
        if (!fullMatch.endsWith('/>')) {
            const contentMatch = fullMatch.match(new RegExp(`<${componentType}[^>]*>(.*)<\/${componentType}>`, 's'));
            if (contentMatch) {
                innerContent = contentMatch[1].trim();
            }
        }
        
        components.push({
            type: componentType,
            props: props,
            content: innerContent
        });
    }
    
    return components;
}

function extractProps(componentString: string): any {
    const props: any = {};
    
    // 간단한 props 추출 (큰따옴표, 작은따옴표, 중괄호 지원)
    const propPattern = /(\w+)=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
    
    let match;
    while ((match = propPattern.exec(componentString)) !== null) {
        const propName = match[1];
        const propValue = match[2] || match[3] || match[4];
        
        // 숫자인지 확인
        if (propValue && !isNaN(Number(propValue))) {
            props[propName] = Number(propValue);
        } else {
            props[propName] = propValue;
        }
    }
    
    return props;
}

function convertToStandardSvg(component: {type: string, props: any, content?: string}): string {
    const { type, props, content } = component;
    
    switch (type) {
        case 'Svg':
            return `<svg ${propsToAttributes(props)}>${content || ''}</svg>`;
        case 'Circle':
            return `<circle ${propsToAttributes(props)} />`;
        case 'Rect':
            return `<rect ${propsToAttributes(props)} />`;
        case 'Path':
            return `<path ${propsToAttributes(props)} />`;
        case 'G':
            return `<g ${propsToAttributes(props)}>${content || ''}</g>`;
        case 'Line':
            return `<line ${propsToAttributes(props)} />`;
        case 'Polygon':
            return `<polygon ${propsToAttributes(props)} />`;
        case 'Polyline':
            return `<polyline ${propsToAttributes(props)} />`;
        case 'Text':
            return `<text ${propsToAttributes(props)}>${content || ''}</text>`;
        case 'Ellipse':
            return `<ellipse ${propsToAttributes(props)} />`;
        default:
            return `<${type.toLowerCase()} ${propsToAttributes(props)}>${content || ''}</${type.toLowerCase()}>`;
    }
}

function propsToAttributes(props: any): string {
    return Object.entries(props)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
}

function getWebviewContent(components: Array<{type: string, props: any, content?: string}>, fileName: string): string {
    const svgElements = components.map((component, index) => {
        const standardSvg = convertToStandardSvg(component);
        
        return `
            <div class="svg-component">
                <div class="component-header">
                    <h3>컴포넌트 ${index + 1}: &lt;${component.type}&gt;</h3>
                </div>
                <div class="svg-container">
                    ${standardSvg}
                </div>
                <div class="props-info">
                    <strong>Props</strong>
                    <pre>${JSON.stringify(component.props, null, 2)}</pre>
                </div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Preview</title>
    <style>
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
        }
        
        .header {
            border-bottom: 2px solid var(--vscode-panel-border);
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2rem;
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
        }
        
        .header p {
            margin: 5px 0;
            opacity: 0.8;
            font-size: 0.95rem;
        }
        
        .svg-component {
            margin-bottom: 40px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 12px;
            overflow: hidden;
            background-color: var(--vscode-sideBar-background);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .component-header {
            background-color: var(--vscode-titleBar-activeBackground);
            color: var(--vscode-titleBar-activeForeground);
            padding: 15px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .component-header h3 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 500;
        }
        
        .svg-container {
            background: linear-gradient(45deg, #f8f9fa 25%, transparent 25%), 
                        linear-gradient(-45deg, #f8f9fa 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #f8f9fa 75%), 
                        linear-gradient(-45deg, transparent 75%, #f8f9fa 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            background-color: #ffffff;
            border: none;
            padding: 30px;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 150px;
        }
        
        .svg-container svg {
            max-width: 100%;
            height: auto;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        
        .props-info {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 20px;
            margin: 0;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .props-info strong {
            color: var(--vscode-textLink-foreground);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .props-info pre {
            margin: 10px 0 0 0;
            font-size: 13px;
            color: var(--vscode-textPreformat-foreground);
            background-color: var(--vscode-editor-background);
            padding: 15px;
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
            overflow-x: auto;
        }
        
        .no-components {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
            font-size: 1.1rem;
        }
        
        .no-components::before {
            content: "🔍";
            display: block;
            font-size: 3rem;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 React Native SVG Preview</h1>
        <p><strong>파일:</strong> ${fileName}</p>
        <p><strong>발견된 컴포넌트:</strong> ${components.length}개</p>
    </div>
    
    ${svgElements}
    
    ${components.length === 0 ? '<div class="no-components">이 파일에서 React Native SVG 컴포넌트를 찾을 수 없습니다.</div>' : ''}
</body>
</html>`;
}

export function deactivate() {} 