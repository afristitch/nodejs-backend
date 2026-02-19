import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

/**
 * Template Renderer Utility
 * Handles loading and rendering email templates with Handlebars
 */

const TEMPLATES_DIR = path.join(process.cwd(), 'src/templates/email');
const PARTIALS_DIR = path.join(TEMPLATES_DIR, 'partials');

// Register Partials
const registerPartials = () => {
    try {
        const partialFiles = fs.readdirSync(PARTIALS_DIR);
        partialFiles.forEach((file) => {
            if (file.endsWith('.html')) {
                const partialName = path.basename(file, '.html');
                const partialContent = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf-8');
                Handlebars.registerPartial(partialName, partialContent);
            }
        });
        console.log('[TemplateRenderer] Partials registered successfully');
    } catch (error) {
        console.error('[TemplateRenderer] Error registering partials:', error);
    }
};

// Initial registration
registerPartials();

/**
 * Render an email template with data
 */
export const renderTemplate = (templateName: string, data: any): string => {
    try {
        const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(templateSource);

        // Inject Logo URL from environment
        const logoUrl = process.env.LOGO_URL || 'https://via.placeholder.com/120x40?text=SewDigital';

        return template({
            ...data,
            logoUrl,
        });
    } catch (error) {
        console.error(`[TemplateRenderer] Error rendering template ${templateName}:`, error);
        return ''; // Return empty string or fallback content
    }
};
