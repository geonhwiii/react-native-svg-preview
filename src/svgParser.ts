import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export interface SvgComponent {
    name: string;
    jsx: string;
    props: Record<string, any>;
}

export class SvgParser {
    async extractSvgComponents(code: string): Promise<SvgComponent[]> {
        const svgComponents: SvgComponent[] = [];
        
        try {
            const ast = parse(code, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            });

            traverse(ast, {
                JSXElement: (path: any) => {
                    const openingElement = path.node.openingElement;
                    
                    if (t.isJSXIdentifier(openingElement.name)) {
                        const elementName = openingElement.name.name;
                        
                        // SVG 관련 컴포넌트 검사
                        if (this.isSvgComponent(elementName)) {
                            const component = this.extractComponentInfo(path.node, elementName);
                            if (component) {
                                svgComponents.push(component);
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('SVG 파싱 중 오류:', error);
        }

        return svgComponents;
    }

    private isSvgComponent(elementName: string): boolean {
        const svgElements = [
            'Svg', 'Circle', 'Ellipse', 'G', 'Text', 'TSpan', 'TextPath',
            'Path', 'Polygon', 'Polyline', 'Line', 'Rect', 'Use', 'Image',
            'Symbol', 'Defs', 'LinearGradient', 'RadialGradient', 'Stop',
            'ClipPath', 'Pattern', 'Mask', 'ForeignObject'
        ];
        
        return svgElements.includes(elementName);
    }

    private extractComponentInfo(node: t.JSXElement, elementName: string): SvgComponent | null {
        try {
            const jsx = this.generateJsxString(node);
            const props = this.extractProps(node.openingElement);
            
            return {
                name: elementName,
                jsx: jsx,
                props: props
            };
        } catch (error) {
            console.error('컴포넌트 정보 추출 중 오류:', error);
            return null;
        }
    }

    private generateJsxString(node: t.JSXElement): string {
        // 간단한 JSX 문자열 생성 (실제로는 더 복잡한 로직이 필요할 수 있음)
        const openingElement = node.openingElement;
        const elementName = t.isJSXIdentifier(openingElement.name) ? openingElement.name.name : 'Unknown';
        
        let jsx = `<${elementName}`;
        
        // 속성 추가
        openingElement.attributes.forEach(attr => {
            if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                const name = attr.name.name;
                if (attr.value) {
                    if (t.isStringLiteral(attr.value)) {
                        jsx += ` ${name}="${attr.value.value}"`;
                    } else if (t.isJSXExpressionContainer(attr.value)) {
                        jsx += ` ${name}={...}`;
                    }
                } else {
                    jsx += ` ${name}`;
                }
            }
        });
        
        if (node.children.length > 0) {
            jsx += `>...</${elementName}>`;
        } else {
            jsx += ' />';
        }
        
        return jsx;
    }

    private extractProps(openingElement: t.JSXOpeningElement): Record<string, any> {
        const props: Record<string, any> = {};
        
        openingElement.attributes.forEach(attr => {
            if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                const name = attr.name.name;
                if (attr.value) {
                    if (t.isStringLiteral(attr.value)) {
                        props[name] = attr.value.value;
                    } else if (t.isJSXExpressionContainer(attr.value)) {
                        props[name] = '[Expression]';
                    }
                } else {
                    props[name] = true;
                }
            }
        });
        
        return props;
    }
} 