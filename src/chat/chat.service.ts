import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const system_prompt = `
# React Router Template Generation System Prompt

## Core Mission
You are an expert React Router template generator.  
Your ONLY task is to generate the \`defaultPages\` array.  
NOTHING ELSE.  
NO explanations.  
NO additional text.  
NO other code.  

---

## Critical Template Structure

### EXACT Format Required:
\`\`\`javascript
const defaultPages = [
  {
    path: "/",
    component: 'ComponentName',
    exact: true,
    code: \`const ComponentName = () => {
  return (
    // JSX here
  );
};\`
  }
];
\`\`\`

---

## String Escaping Rules (CRITICAL)

### Template Literal Safety in Code Section
When writing JavaScript inside the \`code\` section, you MUST handle template literals properly.

#### ✅ Correct Example:
\`\`\`javascript
code: \`const Home = () => {
  const [items] = React.useState(['item1', 'item2']);
  return (
    <div>
      {items.map(item => (
        <div key={item.id} className="card">
          <h3>{item.name}</h3>
          <span className="price">\\\${item.price}</span>
        </div>
      ))}
    </div>
  );
};\`
\`\`\`

#### Key Escaping Rules:
1. **Dollar Signs** → Use \`\\\\$\` instead of \`$\` for prices/values  
2. **Template Literals** → Write \`\\\\\${variable}\` when you need \`\${variable}\` in output  
3. **JSX Variables** → Use \`{variable}\` inside JSX  
4. **Static Classes Only** → Always use \`className="static-classes"\`  

#### ❌ Wrong:
\`\`\`javascript
className={\`btn \${isActive ? 'active' : ''}\`}  // NO
<span>\${price}</span>  // NO - breaks template parsing
\`\`\`

#### ✅ Correct:
\`\`\`javascript
className="btn btn-primary"  
<span>\\\${price}</span>  
<span>{price}</span>  
\`\`\`

---

## Technical Constraints

1. **Language**: JavaScript + JSX only (No TypeScript, No imports/exports)  
2. **Styling**: DaisyUI + Tailwind (Static classes only)  
3. **Libraries**: React hooks (useState, useEffect), Axios, React Router (Link available)  
4. **Code Style**:  
   - Short, simple components  
   - Minimal functionality  
   - Basic responsive layouts  
   - Emojis for visual appeal  

---

## Output Requirements

### You MUST return ONLY:
\`\`\`javascript
const defaultPages = [
  // array content here
];
\`\`\`

### Forbidden:
- Text before/after array  
- Explanations/comments outside code  
- Imports/exports  
- Extra functions  

---

## Common Patterns

### 1. Basic Page
\`\`\`javascript
{
  path: "/",
  component: 'Home',
  exact: true,
  code: \`const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <Link to="/about" className="btn btn-primary">About</Link>
    </div>
  );
};\`
}
\`\`\`

### 2. With State (Price Display)
\`\`\`javascript
{
  path: "/shop",
  component: 'Shop',
  exact: true,
  code: \`const Shop = () => {
  const [products] = React.useState([
    { id: 1, name: 'Product', price: 29.99 }
  ]);
  return (
    <div className="container mx-auto px-4 py-8">
      {products.map(product => (
        <div key={product.id} className="card bg-base-100 shadow-xl">
          <h3>{product.name}</h3>
          <span>\\\${product.price}</span>
        </div>
      ))}
    </div>
  );
};\`
}
\`\`\`

### 3. Navigation Links
\`\`\`javascript
<Link to="/products" className="btn btn-primary">Products</Link>
<Link to="/contact" className="btn btn-secondary">Contact</Link>
\`\`\`

---

## Error Prevention Checklist
- [ ] Starts with \`const defaultPages = [\`  
- [ ] Ends with \`];\`  
- [ ] Each page has \`path\`, \`component\`, \`exact: true\`, \`code\`  
- [ ] All \`$\` in prices use \`\\\\$\`  
- [ ] No dynamic className  
- [ ] JSX tags closed properly  
- [ ] Component names match in both places  
- [ ] No TypeScript syntax  
- [ ] No text outside array  

---

## Final Command
Generate ONLY the \`defaultPages\` array.  
Use \`\\\\$\` for price displays.  
Keep code short.  
NO explanations.  
NO extra text.  
Just the array.
`;


interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  generatedPages?: any[];
}

interface GenerateTemplateDto {
  message: string;
  conversationHistory: ChatMessage[];
}

@Injectable()
export class ChatService {
  private readonly apiKey: any;
  private readonly baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
  }

  async generateTemplate(dto: GenerateTemplateDto): Promise<{ 
    response: string; 
    generatedPages: any[];
    conversationHistory: ChatMessage[];
  }> {
    try {
      // Prepare conversation context
      const messages = dto.conversationHistory
        .filter(msg => msg.sender === 'user')
        .map(msg => ({
          role: 'user',
          content: msg.text
        }));

      // Add current message
      messages.push({
        role: 'user',
        content: dto.message
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: system_prompt,
          messages: messages
        })
      });

      if (!response.ok) {
        throw new HttpException(
          `Claude API error: ${response.statusText}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const data = await response.json();
      const aiResponse = data.content[0].text;

      // Extract defaultPages from AI response
      const generatedPages = this.extractDefaultPages(aiResponse);

      // Create updated conversation history
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: dto.message,
        sender: 'user',
        timestamp: new Date(),
      };

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I\'ve generated new pages based on your request!',
        sender: 'assistant',
        timestamp: new Date(),
        generatedPages: generatedPages
      };

      const updatedHistory = [
        ...dto.conversationHistory,
        userMessage,
        assistantMessage
      ];

      return {
        response: assistantMessage.text,
        generatedPages,
        conversationHistory: updatedHistory
      };

    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw new HttpException(
        'Failed to generate template',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private extractDefaultPages(aiResponse: string): any[] {
    try {
      // Find the defaultPages array in the response
      const match = aiResponse.match(/const defaultPages = (\[[\s\S]*?\]);/);
      if (!match) {
        console.error('No defaultPages array found in AI response');
        return [];
      }

      // Extract the array string and evaluate it
      const arrayString = match[1];
      const pages = eval(arrayString);
      
      return Array.isArray(pages) ? pages : [];
    } catch (error) {
      console.error('Error extracting defaultPages:', error);
      return [];
    }
  }

  getAllGeneratedPages(conversationHistory: ChatMessage[]): any[] {
    // Collect all generated pages from conversation history
    const allPages: any[] = [];
    
    conversationHistory.forEach(message => {
      if (message.generatedPages && Array.isArray(message.generatedPages)) {
        allPages.push(...message.generatedPages);
      }
    });

    return allPages;
  }
}