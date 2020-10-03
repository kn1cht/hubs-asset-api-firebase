'use strict';

const {firestore} = require('firebase-admin');
const functions = require('firebase-functions');
const {google} = require('googleapis');
const SECRET =  require('./secret.json');
const SPREADSHEET = require('./spreadsheet.json');
const store = new (require('./store'))();

exports.httpEvent = functions.https.onRequest(async (req, res) => {
  const filename = req.path.split('/')[1];

  const sheetData = await store.getDocInCollection('sheet', 0);
  const updatedMillis = sheetData.updatedAt ? sheetData.updatedAt.toMillis() : 0;
  const elpsedTimeSec = (new Date().getTime() -  updatedMillis) / 1000;
  let sheetVals = JSON.parse(sheetData.vals || '{}');

  if(elpsedTimeSec >= 60 || Object.keys(sheetVals).length === 0) {
    sheetVals = await getSpreadSheetValsFromApi();
    await store.setDocInCollection('sheet', 0, {
      updatedAt: firestore.FieldValue.serverTimestamp(),
      vals: JSON.stringify(sheetVals)
    });
  }
  const urlIndex = sheetVals[SPREADSHEET.fileColumnNo].indexOf(filename);
  res.redirect(302, sheetVals[SPREADSHEET.urlColumnNo][urlIndex]);
});

const getSpreadSheetValsFromApi = async () => {
  const auth = new google.auth.JWT(
    SECRET.client_email, null, SECRET.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  const sheets = google.sheets({version: 'v4'});
  const sheetRes = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: SPREADSHEET.id,
    range: 'main',
    majorDimension: 'COLUMNS',
  });
  return sheetRes.data.values;
}
