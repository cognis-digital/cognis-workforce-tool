interface CodeTemplate<T> {
  name: string;
  getTemplate: (data: T) => string;
}

interface CodeGeneratorOptions {
  outputPath: string;
  prettierConfig?: any;
}

class PolymorphicCodeGenerator {
  private templates: Map<string, CodeTemplate<any>> = new Map();
  private options: CodeGeneratorOptions;
  
  constructor(options: CodeGeneratorOptions) {
    this.options = options;
  }
  
  registerTemplate<T>(template: CodeTemplate<T>): void {
    this.templates.set(template.name, template);
  }
  
  async generateCode<T>(templateName: string, data: T): Promise<string> {
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    let code = template.getTemplate(data);
    
    // Format code if prettier is available
    try {
      if (this.options.prettierConfig) {
        const prettier = await import('prettier');
        code = await prettier.format(code, {
          parser: 'typescript',
          ...this.options.prettierConfig
        });
      }
    } catch (error) {
      console.warn('Failed to format code with prettier:', error);
    }
    
    return code;
  }
  
  // Generate TypeScript types from a state object
  generateTypesFromState(state: any, typeName: string = 'GeneratedState'): string {
    return this.generateTypeDefinition(state, typeName);
  }
  
  private generateTypeDefinition(value: any, typeName: string, indent: string = ''): string {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${indent}export type ${typeName} = any[];`;
      }
      
      // Use the first item as a sample
      const itemType = `${typeName}Item`;
      const itemTypeDefinition = this.generateTypeDefinition(value[0], itemType, indent);
      
      return `${itemTypeDefinition}\n${indent}export type ${typeName} = ${itemType}[];`;
    }
    
    if (value === null || value === undefined) {
      return `${indent}export type ${typeName} = null | undefined;`;
    }
    
    if (typeof value === 'object') {
      const lines: string[] = [`${indent}export interface ${typeName} {`];
      
      for (const [key, propValue] of Object.entries(value)) {
        const properTypeName = `${typeName}${key.charAt(0).toUpperCase() + key.slice(1)}`;
        
        if (typeof propValue === 'object' && propValue !== null) {
          const nestedTypeDefinition = this.generateTypeDefinition(
            propValue, 
            properTypeName, 
            indent + '  '
          );
          lines.push(nestedTypeDefinition);
          lines.push(`${indent}  ${key}: ${properTypeName};`);
        } else {
          const typeString = typeof propValue;
          lines.push(`${indent}  ${key}: ${typeString};`);
        }
      }
      
      lines.push(`${indent}}`);
      return lines.join('\n');
    }
    
    return `${indent}export type ${typeName} = ${typeof value};`;
  }
}

export default PolymorphicCodeGenerator;
