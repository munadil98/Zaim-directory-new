import Papa from 'papaparse';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1n3Xh_NQA8hqLtAocIFc2BmYeq4CDCCgmmdKfDPkdUto/export?format=csv';

async function test() {
  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();
    const results = Papa.parse(csvText);
    console.log('Headers (Row 3):', results.data[2]);
    console.log('Sample Row (Row 5):', results.data[4]);
  } catch (err) {
    console.error(err);
  }
}

test();
