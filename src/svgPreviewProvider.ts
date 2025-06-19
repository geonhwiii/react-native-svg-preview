import * as vscode from 'vscode';
import { SvgComponent } from './svgParser';

export class SvgPreviewProvider implements vscode.WebviewPanelSerializer {
    private readonly _extensionUri: vscode.Uri;
    private _panels = new Map<string, vscode.WebviewPanel>();

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any): Promise<void> {
        // 웹뷰 패널 복원 로직
        this.setupWebviewPanel(webviewPanel, state.uri, state.svgComponents);
    }

    createPreviewPanel(uri: vscode.Uri, svgComponents: SvgComponent[]): void {
        const fileName = uri.path.split('/').pop() || 'Unknown';
        const panelKey = uri.toString();

        // 기존 패널이 있으면 포커스
        if (this._panels.has(panelKey)) {
            this._panels.get(panelKey)!.reveal();
            return;
        }

        // 새 패널 생성
        const panel = vscode.window.createWebviewPanel(
            'reactNativeSvgPreview',
            `SVG Preview: ${fileName}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        this._panels.set(panelKey, panel);
        this.setupWebviewPanel(panel, uri, svgComponents);

        // 패널이 닫힐 때 정리
        panel.onDidDispose(() => {
            this._panels.delete(panelKey);
        });
    }

    private setupWebviewPanel(panel: vscode.WebviewPanel, uri: vscode.Uri, svgComponents: SvgComponent[]): void {
        panel.webview.html = this.generateWebviewContent(svgComponents, uri.path);
        
        // 상태 저장
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'refresh':
                        // 새로고침 로직
                        break;
                }
            }
        );
    }

    private generateWebviewContent(svgComponents: SvgComponent[], filePath: string): string {
        const componentCards = svgComponents.map(component => `
            <div class="component-card">
                <div class="component-header">
                    <h3>${component.name}</h3>
                    <div class="component-props">
                        ${Object.entries(component.props).map(([key, value]) => 
                            `<span class="prop"><strong>${key}:</strong> ${value}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="component-preview">
                    <div class="jsx-code">
                        <pre><code>${this.escapeHtml(component.jsx)}</code></pre>
                    </div>
                    <div class="svg-render">
                        ${this.convertToWebSvg(component)}
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SVG Preview</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    
                    .header {
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: var(--vscode-titleBar-activeForeground);
                    }
                    
                    .file-path {
                        font-size: 14px;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 5px;
                    }
                    
                    .component-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        margin-bottom: 20px;
                        overflow: hidden;
                    }
                    
                    .component-header {
                        background: var(--vscode-titleBar-activeBackground);
                        padding: 15px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    
                    .component-header h3 {
                        margin: 0;
                        font-size: 18px;
                        color: var(--vscode-titleBar-activeForeground);
                    }
                    
                    .component-props {
                        margin-top: 8px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    
                    .prop {
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 12px;
                    }
                    
                    .component-preview {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        padding: 20px;
                    }
                    
                    .jsx-code {
                        background: var(--vscode-textCodeBlock-background);
                        border-radius: 4px;
                        padding: 15px;
                        overflow-x: auto;
                    }
                    
                    .jsx-code pre {
                        margin: 0;
                        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                        font-size: 13px;
                        line-height: 1.4;
                    }
                    
                    .svg-render {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white;
                        border: 1px solid #e0e0e0;
                        border-radius: 4px;
                        padding: 20px;
                        min-height: 100px;
                    }
                    
                    .no-components {
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                        font-style: italic;
                        padding: 40px;
                    }
                    
                    @media (max-width: 768px) {
                        .component-preview {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>React Native SVG Preview</h1>
                    <div class="file-path">${filePath}</div>
                </div>
                
                ${svgComponents.length > 0 ? componentCards : 
                    '<div class="no-components">이 파일에서 SVG 컴포넌트를 찾을 수 없습니다.</div>'
                }
            </body>
            </html>
        `;
    }

    private convertToWebSvg(component: SvgComponent): string {
        // React Native SVG를 웹 SVG로 변환하는 간단한 로직
        // 실제로는 더 복잡한 변환이 필요할 수 있음
        const { name, props } = component;
        
        switch (name) {
            case 'Svg':
                return `<svg width="${props.width || 100}" height="${props.height || 100}" viewBox="${props.viewBox || '0 0 100 100'}">
                    <text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="12">SVG 컴포넌트</text>
                </svg>`;
            case 'Circle':
                return `<svg width="100" height="100">
                    <circle cx="${props.cx || 50}" cy="${props.cy || 50}" r="${props.r || 25}" 
                            fill="${props.fill || '#007ACC'}" stroke="${props.stroke || 'none'}" />
                </svg>`;
            case 'Rect':
                return `<svg width="100" height="100">
                    <rect x="${props.x || 10}" y="${props.y || 10}" 
                          width="${props.width || 80}" height="${props.height || 80}" 
                          fill="${props.fill || '#007ACC'}" stroke="${props.stroke || 'none'}" />
                </svg>`;
            case 'Path':
                return `<svg width="100" height="100" viewBox="0 0 100 100">
                    <path d="${props.d || 'M10,10 L90,90'}" 
                          fill="${props.fill || 'none'}" stroke="${props.stroke || '#007ACC'}" 
                          stroke-width="${props.strokeWidth || 2}" />
                </svg>`;
            default:
                return `<svg width="100" height="100">
                    <rect width="100" height="100" fill="#f0f0f0" stroke="#ccc" />
                    <text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="10">${name}</text>
                </svg>`;
        }
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
} 