import PolymorphicCodeGenerator from '../codegen/polymorphicGenerator';

describe('PolymorphicCodeGenerator', () => {
  const generator = new PolymorphicCodeGenerator({
    outputPath: './src/generated',
    prettierConfig: { 
      semi: true, 
      singleQuote: true 
    }
  });

  it('should generate code from a template', async () => {
    // Register a test template
    // Define template data interface
    interface TemplateData {
      componentName: string;
      className: string;
      title: string;
      description: string;
    }

    generator.registerTemplate({
      name: 'testComponent',
      getTemplate: (data: TemplateData) => `
        import React from 'react';

        export function ${data.componentName}(props) {
          return (
            <div className="${data.className}">
              <h2>${data.title}</h2>
              <p>${data.description}</p>
            </div>
          );
        }
      `
    });
    
    interface TestComponentData {
      componentName: string;
      className: string;
      title: string;
      description: string;
    }
    
    const testData: TestComponentData = {
      componentName: 'TestComponent',
      className: 'test-component',
      title: 'Test Title',
      description: 'Test Description'
    };
    
    const code = await generator.generateCode('testComponent', testData);
    
    
    expect(code).toContain('import React');
    expect(code).toContain('export function TestComponent');
    expect(code).toContain('<div className="test-component">');
    expect(code).toContain('<h2>Test Title</h2>');
    expect(code).toContain('<p>Test Description</p>');
  });

  it('should generate TypeScript type definitions from state objects', () => {
    const testState = {
      counter: 42,
      text: 'hello',
      nested: {
        value: true,
        items: ['a', 'b', 'c']
      },
      nullValue: null
    };
    
    const typeDefs = generator.generateTypesFromState(testState, 'TestState');
    
    expect(typeDefs).toContain('export interface TestState');
    expect(typeDefs).toContain('counter: number;');
    expect(typeDefs).toContain('text: string;');
    expect(typeDefs).toContain('export interface TestStateNested');
    expect(typeDefs).toContain('value: boolean;');
    expect(typeDefs).toContain('items: string[];');
    expect(typeDefs).toContain('nullValue: null | undefined;');
  });
});
