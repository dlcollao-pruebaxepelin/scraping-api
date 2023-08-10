const puppeteer = require('puppeteer');
const axios = require('axios');
const {google} = require('googleapis');
const sheets = google.sheets('v4');

// podría haberse leído desde un archivo json.
const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "xepelin-api",
  "private_key_id": "2102b6d5df35b99ed5b9a46bf405e5a29786d614",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuyAfaJrESX8ug\nxll6sxm2/4OuU+WFItP44ph6z8Kg1T23FVM0HAjjKTEbLBZIpgJOMv9Ot6bMc/V6\nUt4gpyA2s4k149nqKshmwZeUjqvanXdcPvBQeaTA2TyWhlr4kWi6xJjRTB51Hqmo\nXtRAs//1RuKOT/8pKlmQlxAI1AXLUDVDKPTlYlNZYQTlreFVqFFR80yWEdAybnS9\nXPbzhOaolCiJH3nBT6SLzePgeLrq5RzD0tgHIVxZ8a2QQ1BJAFFuJTbl6iw7FiFN\nGoFaQf8GdbAJRdIt05Twbu7EjNrOSsTC0O79dOR+7zlkuva84JJs7ivdJZlx5osm\n6uIWj2u3AgMBAAECggEARMPVdwpfA2wmKOiw/rnlZZ7M97Lxa/qibFr2g+cm23Fa\nWSRuOmPHSVyFAfxL/iQ2Zv7gfN97pBgBXjGpTC6E2ZC0bLvrGhrgArGrChtB2P64\nHdZzZS4e2HL/x/cvZnmLO2Qq/bmViB3awTAiERzgmOddLoGh0dfkKiOM/vQwHWeW\niihz7IZvjLCsghPSY3Z1BgOQ/zLCMpPrXf30Noz1QejPPAWvwybLtFmo4EWVDx1q\nRXwzyCRfzRBO0Nz40uOUU5ZTqizNoBFplVKBy09uypxKjdHtBD4FwPrd6vmGKtip\nQ0Drq39DUBCTjGfcHamr85ne02b4M+bRO1zWe8s+dQKBgQD0NIA0WAUY0HLMZM87\n6i2fwk3lPjt/oZ+SQlhy3hIL5Dfnms05MudjaoAMLw/sTR+orby1KX1gkyNtPq02\nb6pe4+BsFPeVZn4Nm3Aj/FTLtKhTRu94EvE2/Jvo8b9CYOPVM4Lh/Va050xxwZ3/\njcU7vgu84b+YrJzUb7o0WElb6wKBgQC3OSIWPWgmMfmaCbcU502sVsuBBTmZpouZ\npDFTcbyf88XiyoUlxBb7SXiP+b5WXbA7h6X2Q4eZQJT5qUWBRR6xiC6mOZLqa1ec\nKwen/GbztSKuSROR5XBkuT7KxUf41rwTeg5iqLBOAoREwrTUsoRPmLN/XcBs33L+\nsKgTIZh4ZQKBgQCcIs0tqnFn0i7z/Ch72FhfYu5G+ik0i3PpIb5HgzDqpXoQ/Orl\n/WPwLnG8WILHxO/O+3ZCJkrhanImMQKyYWb+0Jf2wtkhjqxdqtpiR703mUReKmaF\n0Sakz5InuBlfKW/CKvMt5rp/Y7t+qBqLAGvwrKv4kiXcSdDkCqN1QFV3DQKBgGvZ\nBWdx3cwdvn4dGdcED4RR0pevK6h1j9Zv/1jOqei85M4JxzXjpmNja8PTjWXo38Mq\npVW/iiF7EjWinXbp6Jc3Qb42RXQWmwshiPAocbEh/bf467wFAZNINt3EIgkm3K3a\nOn14Lc69TH3s3eQU8CyqBX4DATEUleu0sDoSnFzBAoGAKjYomdhV/tGkEDq9KBR5\nOpnVAzbtA+un9+TCtGvi1fLUlRhqeDLRKxWX2aGNvkKhcMSbWpqlWmylI72uEllV\nF21/rOWS9gXNUmI2+WNjiTukiC489szIdJI/grL0V3/X+RQcddpB6agezRmrAs+/\n0UKIIKR/97kYXfmDEtry5PE=\n-----END PRIVATE KEY-----\n",
  "client_email": "xepelin-api@xepelin-api.iam.gserviceaccount.com",
  "client_id": "112265972737927197230",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/xepelin-api%40xepelin-api.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
// instanciado global solo por simplicidad y orden.
const jwt = new google.auth.JWT(
  SERVICE_ACCOUNT.client_email,
  null,
  SERVICE_ACCOUNT.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

async function getLinksFromBase(category, webhookUrl) {
    console.log('Starting the scraper...');
    
    const urlBase = 'https://xepelin.com/blog/';
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: puppeteer.executablePath()
  });
    const page = await browser.newPage();
    
    console.log(`Navigating to ${urlBase}${category}...`);
    await page.goto(urlBase + category, { waitUntil: "networkidle2" });

    while (true) {
        console.log('Searching for the button...');
        const button = await page.$("#__next > div > main > div.py-8.md\\:py-10.lg\\:py-14.relative.bg-xrabbit-100 > div > div.w-full.grid.justify-center.mt-12 > button");

        // Verificar que el botón tenga el texto "Cargar más.
        const buttonText = button ? await page.evaluate(el => el.innerText, button) : null;

        if (!button || buttonText !== "Cargar más") {
            console.log('Button with text "Cargar más" not found. Exiting loop...');
            break;
        }

        console.log('Clicking the button...');
        await button.click();
        console.log('Waiting for updates after button click...');
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('Fetching href elements...');
    const hrefElements = await page.$$('a[href]');
    const hrefs = await Promise.all(hrefElements.map(a => a.evaluate(el => el.attributes['href'].nodeValue)));
    const filteredHrefs = filterLinks(hrefs, urlBase, category);

    console.log(`Found ${filteredHrefs.length} filtered hrefs in total.`);
    
    

    console.log('Returning the collected hrefs...');
    const fetchedInfo = []
    for (let url of filteredHrefs) {
      console.log("Navigating to", url)
      await page.goto(url, { waitUntil: "networkidle2" });
  
      // Aquí, puedes extraer la información que desees de esa página específica
      const info = await extractInfoFromPage(page, category);
      fetchedInfo.push(info)
    }
  console.log('Closing the browser...');
  await browser.close();
  await clearSheetContent();
  for (let data of fetchedInfo) {
    await appendToSheet(data);
  }
  notifyWebhook(webhookUrl)
  return fetchedInfo;
}

function filterLinks(hrefs, urlBase, category) {
    console.log(`Filtering links for base URL: ${urlBase} and category: ${category}`);
    const filteredHrefs = hrefs.filter(href => href.includes(urlBase) && href.includes(category));
    filteredHrefs.shift(); // Quitar primer elemento, ya que es la página base de la categoría.
    return filteredHrefs;
}

async function extractInfoFromPage(page, category) {
  const title = await page.$eval('h1', element => element.innerText);
  
  // Selector específico para el autor usando el selector que proporcionaste
  const authorSelector = "#__next > div > main > div > div > div:nth-child(2) > div.ArticleSingle_contentGrid__5uT8q > div.grid.md\\:col-span-4 > div.flex.gap-4.items-center.mb-6 > div.flex.gap-2 > div:nth-child(1)";
  
  // Selector específico para el tiempo de lectura
  const readingTimeSelector = "#__next > div > main > div > div > div:nth-child(1) > div.flex.justify-center.gap-6.mb-12 > div > div";
  
  // Intenta extraer el autor; si el selector no encuentra nada, establece el autor como 'Desconocido' o alguna cadena vacía.
  let author, readingTime;
  try {
      author = await page.$eval(authorSelector, element => element.innerText);
  } catch (error) {
      console.error("No se pudo encontrar el autor:", error);
      author = "Desconocido";
  }

  try {
      readingTime = await page.$eval(readingTimeSelector, element => element.innerText);
  } catch (error) {
      console.error("No se pudo encontrar el tiempo de lectura:", error);
      readingTime = "Desconocido";
  }

  return { title, author, category, readingTime };
}

async function appendToSheet(data) {
  const SPREADSHEET_ID = '1JrSUeVMSsOga1zvJYC3yFc6Dg6LDayFnLHCTzVyD5po';
  const range = 'Hoja 1';

  // Usa este cliente autenticado para hacer la solicitud
  try {
      const response = await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: range,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          auth: jwt,
          requestBody: {
              values: [
                  [data.title, data.author, data.category, data.readingTime]
              ]
          }
      });

      console.log(`Datos añadidos con éxito: ${JSON.stringify(response.data)}`);
  } catch (error) {
      console.error('Error al añadir datos:', error);
      console.log(error.response.data);
  }
}

async function clearSheetContent() {
  const SPREADSHEET_ID = '1JrSUeVMSsOga1zvJYC3yFc6Dg6LDayFnLHCTzVyD5po';
  const range = 'Hoja 1!A2:Z'; // Borrar desde la fila 2 hasta el final en las columnas hasta la Z.

  try {
      const sheets = google.sheets({version: 'v4'});
      await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: range,
          auth: jwt
      });

      console.log(`Datos borrados con éxito.`);
  } catch (error) {
      console.error('Error al borrar datos:', error);
  }
}

async function notifyWebhook(webhookUrl) {
  const sheetLink = 'https://docs.google.com/spreadsheets/d/1JrSUeVMSsOga1zvJYC3yFc6Dg6LDayFnLHCTzVyD5po/edit?pli=1#gid=0';
  const email = 'dlcollao@uc.cl'
  const payload = {
    email: email,
    link: sheetLink
  };

  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Webhook notificado con éxito: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error('Error al notificar al webhook:', error);
  }
}


module.exports = getLinksFromBase;
