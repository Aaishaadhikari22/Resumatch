import puppeteer from "puppeteer";

/**
 * Convert HTML to PDF using Puppeteer
 * @param {string} htmlContent - HTML content to convert
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePDFFromHTML = async (htmlContent) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set content and wait for any images to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF with A4 format and optimized margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      },
      printBackground: true,
      scale: 1
    });

    await browser.close();
    return pdfBuffer;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error("PDF generation error:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};
