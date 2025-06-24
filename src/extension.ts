import * as vscode from 'vscode';

// 전역 변수로 웹뷰 패널 참조 저장
let currentPanel: vscode.WebviewPanel | undefined = undefined;
let miniPreviewProvider: SvgMiniPreviewProvider | undefined = undefined;

// 다국어 지원
interface LocaleStrings {
    extensionActivated: string;
    extensionWorks: string;
    selectFile: string;
    noSvgComponents: string;
    componentsFound: string;
    errorOccurred: string;
    miniPreviewUpdateError: string;
    unknownError: string;
    openTsxFile: string;
    reactNativeSvgPreview: string;
    noSvgComponentsFound: string;
    svgComponents: string;
    props: string;
    file: string;
    refreshSvgMiniPreview: string;
}

const locales: { [key: string]: LocaleStrings } = {
    ko: {
        extensionActivated: 'React Native SVG Preview 확장 프로그램이 활성화되었습니다!',
        extensionWorks: '확장 프로그램이 작동합니다!',
        selectFile: '파일을 선택해주세요.',
        noSvgComponents: '이 파일에서 React Native SVG 컴포넌트를 찾을 수 없습니다.',
        componentsFound: '개의 SVG 컴포넌트를 찾았습니다!',
        errorOccurred: '오류가 발생했습니다: ',
        miniPreviewUpdateError: '미니 프리뷰 업데이트 중 오류:',
        unknownError: '알 수 없는 오류가 발생했습니다',
        openTsxFile: 'TSX 파일을 열어서<br>React Native SVG를<br>미리보기하세요',
        reactNativeSvgPreview: '🎨 React Native SVG Preview',
        noSvgComponentsFound: 'SVG 컴포넌트를<br>찾을 수 없습니다',
        svgComponents: '개의 SVG 컴포넌트',
        props: 'Props',
        file: '파일:',
        refreshSvgMiniPreview: 'Refresh SVG Mini Preview'
    },
    en: {
        extensionActivated: 'React Native SVG Preview extension is now active!',
        extensionWorks: 'Extension is working!',
        selectFile: 'Please select a file.',
        noSvgComponents: 'No React Native SVG components found in this file.',
        componentsFound: ' SVG components found!',
        errorOccurred: 'An error occurred: ',
        miniPreviewUpdateError: 'Error updating mini preview:',
        unknownError: 'Unknown error occurred',
        openTsxFile: 'Open a TSX file to<br>preview React Native SVG<br>components',
        reactNativeSvgPreview: '🎨 React Native SVG Preview',
        noSvgComponentsFound: 'No SVG components<br>found',
        svgComponents: ' SVG components',
        props: 'Props',
        file: 'File:',
        refreshSvgMiniPreview: 'Refresh SVG Mini Preview'
    }
};

// 현재 언어 가져오기
function getCurrentLocale(): string {
    const vscodeLang = vscode.env.language;
    return vscodeLang.startsWith('ko') ? 'ko' : 'en';
}

// 현재 언어의 문자열 가져오기
function getLocaleString(key: keyof LocaleStrings): string {
    const currentLang = getCurrentLocale();
    return locales[currentLang][key];
}

export function activate(context: vscode.ExtensionContext) {
    console.log(getLocaleString('extensionActivated'));
    
    // 미니 프리뷰 프로바이더 등록
    miniPreviewProvider = new SvgMiniPreviewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('svgMiniPreview', miniPreviewProvider)
    );
    
    // 테스트 명령 등록
    const testCommand = vscode.commands.registerCommand('react-native-svg-preview.test', () => {
        vscode.window.showInformationMessage(getLocaleString('extensionWorks'));
    });
    
    // SVG 미리보기 명령 등록
    const previewCommand = vscode.commands.registerCommand('react-native-svg-preview.previewSvg', async (uri?: vscode.Uri) => {
        await showSvgPreview(uri);
    });
    
    // 미니 프리뷰 새로고침 명령 등록
    const refreshMiniPreviewCommand = vscode.commands.registerCommand('react-native-svg-preview.refreshMiniPreview', () => {
        if (miniPreviewProvider && vscode.window.activeTextEditor) {
            miniPreviewProvider.updatePreview(vscode.window.activeTextEditor.document.uri);
        }
    });
    
    // 활성 에디터 변경 감지
    const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        if (editor) {
            // 기존 패널 업데이트
            if (currentPanel && editor.document.languageId === 'typescriptreact') {
                await updateSvgPreview(editor.document.uri);
            }
            
            // 미니 프리뷰 업데이트
            if (miniPreviewProvider && editor.document.languageId === 'typescriptreact') {
                miniPreviewProvider.updatePreview(editor.document.uri);
            }
        }
    });
    
    // 문서 변경 감지 (실시간 업데이트)
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.languageId === 'typescriptreact' && miniPreviewProvider) {
            // 디바운싱을 위해 타이머 사용
            clearTimeout(miniPreviewProvider.updateTimer);
            miniPreviewProvider.updateTimer = setTimeout(() => {
                miniPreviewProvider!.updatePreview(event.document.uri);
            }, 500);
        }
    });
    
    context.subscriptions.push(
        testCommand, 
        previewCommand, 
        refreshMiniPreviewCommand,
        activeEditorChangeListener,
        documentChangeListener
    );
}

async function showSvgPreview(uri?: vscode.Uri) {
    // 현재 활성 에디터에서 URI 가져오기
    if (!uri && vscode.window.activeTextEditor) {
        uri = vscode.window.activeTextEditor.document.uri;
    }
    
    if (!uri) {
        vscode.window.showErrorMessage(getLocaleString('selectFile'));
        return;
    }
    
    try {
        // 파일 내용 읽기
        const document = await vscode.workspace.openTextDocument(uri);
        const content = document.getText();
        
        // SVG 컴포넌트 추출
        const svgComponents = extractSvgComponents(content);
        
        if (svgComponents.length === 0) {
            vscode.window.showInformationMessage(getLocaleString('noSvgComponents'));
            return;
        }
        
        // 패널이 이미 열려있는지 확인
        if (currentPanel) {
            // 기존 패널이 열려있으면 내용만 업데이트
            currentPanel.webview.html = getWebviewContent(svgComponents, uri.fsPath);
            currentPanel.title = `SVG Preview - ${uri.fsPath.split('/').pop()}`;
            currentPanel.reveal(); // 패널을 포커스로 가져오기
        } else {
            // 새 패널 생성
            currentPanel = vscode.window.createWebviewPanel(
                'svgPreview',
                `SVG Preview - ${uri.fsPath.split('/').pop()}`,
                vscode.ViewColumn.Two,
                {
                    enableScripts: true
                }
            );
            
            // 패널이 닫힐 때 참조 정리
            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            });
            
            // SVG 컴포넌트들을 HTML로 변환
            currentPanel.webview.html = getWebviewContent(svgComponents, uri.fsPath);
        }
        
        const currentLang = getCurrentLocale();
        const message = currentLang === 'ko' 
            ? `${svgComponents.length}${getLocaleString('componentsFound')}`
            : `${svgComponents.length}${getLocaleString('componentsFound')}`;
        vscode.window.showInformationMessage(message);
        
    } catch (error) {
        vscode.window.showErrorMessage(`${getLocaleString('errorOccurred')}${error}`);
    }
}

async function updateSvgPreview(uri: vscode.Uri) {
    if (!currentPanel) {
        return; // 패널이 열려있지 않으면 업데이트하지 않음
    }
    
    try {
        // 파일 내용 읽기
        const document = await vscode.workspace.openTextDocument(uri);
        const content = document.getText();
        
        // SVG 컴포넌트 추출
        const svgComponents = extractSvgComponents(content);
        
        // 패널 내용 업데이트
        currentPanel.webview.html = getWebviewContent(svgComponents, uri.fsPath);
        currentPanel.title = `SVG Preview - ${uri.fsPath.split('/').pop()}`;
        
    } catch (error) {
        console.error(getLocaleString('miniPreviewUpdateError'), error);
    }
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
        const svgName = fileName.split('/').pop()?.split('.')[0];
        
        return `
            <div class="svg-component">
                <div class="component-header">
                    <h3>${svgName}</h3>
                </div>
                <div class="svg-container">
                    ${standardSvg}
                </div>
                <div class="props-info">
                    <strong>${getLocaleString('props')}</strong>
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
        <h1>${getLocaleString('reactNativeSvgPreview')}</h1>
        <p><strong>${getLocaleString('file')}</strong> ${fileName}</p>
    </div>
    
    ${svgElements}
    
    ${components.length === 0 ? `<div class="no-components">${getLocaleString('noSvgComponents')}</div>` : ''}
</body>
</html>`;
}

export function deactivate() {}

// 미니 프리뷰 프로바이더 클래스
class SvgMiniPreviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'svgMiniPreview';
    private _view?: vscode.WebviewView;
    public updateTimer?: NodeJS.Timeout;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // 초기 컨텐츠 설정
        this.updateView();

        // 현재 활성 에디터가 있으면 미리보기 업데이트
        if (vscode.window.activeTextEditor?.document.languageId === 'typescriptreact') {
            this.updatePreview(vscode.window.activeTextEditor.document.uri);
        }
    }

    public async updatePreview(uri: vscode.Uri) {
        if (!this._view) {
            return;
        }

        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const svgComponents = extractSvgComponents(content);
            
            if (svgComponents.length > 0) {
                this._view.webview.html = this.getMiniPreviewContent(svgComponents, uri.fsPath);
            } else {
                this._view.webview.html = this.getEmptyContent();
            }
        } catch (error: any) {
            console.error(getLocaleString('miniPreviewUpdateError'), error);
            this._view.webview.html = this.getErrorContent(error.message || getLocaleString('unknownError'));
        }
    }

    private updateView() {
        if (!this._view) {
            return;
        }
        this._view.webview.html = this.getWelcomeContent();
    }

    private getWelcomeContent(): string {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Mini Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 16px;
            text-align: center;
        }
        .welcome {
            padding: 20px 0;
        }
        .icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        .message {
            opacity: 0.7;
            font-size: 0.9rem;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="welcome">
        <div class="icon">🎨</div>
        <div class="message">
            ${getLocaleString('openTsxFile')}
        </div>
    </div>
</body>
</html>`;
    }

    private getEmptyContent(): string {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Mini Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 16px;
            text-align: center;
        }
        .empty {
            padding: 20px 0;
        }
        .icon {
            font-size: 1.5rem;
            margin-bottom: 8px;
            opacity: 0.5;
        }
        .message {
            opacity: 0.6;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="empty">
        <div class="icon">🔍</div>
        <div class="message">
            ${getLocaleString('noSvgComponentsFound')}
        </div>
    </div>
</body>
</html>`;
    }

    private getErrorContent(error: string): string {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Mini Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 16px;
            text-align: center;
        }
        .error {
            padding: 20px 0;
        }
        .icon {
            font-size: 1.5rem;
            margin-bottom: 8px;
        }
        .message {
            font-size: 0.8rem;
            word-break: break-word;
        }
    </style>
</head>
<body>
    <div class="error">
        <div class="icon">⚠️</div>
        <div class="message">${error}</div>
    </div>
</body>
</html>`;
    }

    private getMiniPreviewContent(components: Array<{type: string, props: any, content?: string}>, fileName: string): string {
        const svgElements = components.map((component, index) => {
            const standardSvg = convertToStandardSvg(component);
            return `
                <div class="svg-item" data-index="${index}">
                    <div class="svg-wrapper">
                        ${standardSvg}
                    </div>
                </div>
            `;
        }).join('');

        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Mini Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 8px;
        }
        
        .header {
            font-size: 0.75rem;
            opacity: 0.7;
            margin-bottom: 8px;
            text-align: center;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 6px;
        }
        
        .svg-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .svg-item {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            overflow: hidden;
            background-color: var(--vscode-editor-background);
        }
        
        .svg-wrapper {
            background: linear-gradient(45deg, #f8f9fa 25%, transparent 25%), 
                        linear-gradient(-45deg, #f8f9fa 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #f8f9fa 75%), 
                        linear-gradient(-45deg, transparent 75%, #f8f9fa 75%);
            background-size: 8px 8px;
            background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
            background-color: #ffffff;
            padding: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60px;
        }
        
        .svg-wrapper svg {
            max-width: 100%;
            max-height: 80px;
            height: auto;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }
        
        .count-info {
            text-align: center;
            font-size: 0.7rem;
            opacity: 0.6;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid var(--vscode-panel-border);
        }
    </style>
</head>
<body>
    <div class="header">
        📱 ${fileName.split('/').pop()?.split('.')[0] || 'SVG'}
    </div>
    
    <div class="svg-container">
        ${svgElements}
    </div>
    
    <div class="count-info">
        ${getCurrentLocale() === 'ko' ? `${components.length}${getLocaleString('svgComponents')}` : `${components.length}${getLocaleString('svgComponents')}`}
    </div>
</body>
</html>`;
    }
} 