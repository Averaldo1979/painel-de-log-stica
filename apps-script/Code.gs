// =============================================================
// PAINEL DE LOGÍSTICA - Google Apps Script REST API
// Cole este código no editor do Apps Script da sua planilha
// e publique como Aplicativo da Web (Anyone can access)
// =============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

const SHEETS = {
  units: 'units',
  teams: 'teams',
  cargos: 'cargos',
  users: 'users'
};

// --- HEADERS de cada aba ---
const HEADERS = {
  units: ['id', 'name'],
  teams: ['id', 'number', 'unitId', 'unit'],
  cargos: [
    'id', 'cargoNumber', 'slaughterTime', 'teamId', 'integrated',
    'city', 'pickupTime', 'birdCount', 'totalLoad', 'unitId', 'unit',
    'status', 'startTime', 'endTime', 'endDate', 'horario_inicio', 'horario_fim'
  ],
  users: ['id', 'name', 'email', 'password', 'role', 'allowedMenus', 'allowedUnits']
};

// ---------------------------------------------------------------
// Inicializa as abas com headers se ainda não existirem
// ---------------------------------------------------------------
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const [key, name] of Object.entries(SHEETS)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    const firstRow = sheet.getRange(1, 1, 1, HEADERS[key].length).getValues()[0];
    const isEmpty = firstRow.every(v => v === '');
    if (isEmpty) {
      sheet.getRange(1, 1, 1, HEADERS[key].length).setValues([HEADERS[key]]);
      sheet.getRange(1, 1, 1, HEADERS[key].length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }
}

// ---------------------------------------------------------------
// Resposta CORS
// ---------------------------------------------------------------
function corsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ---------------------------------------------------------------
// GET: busca todos os registros de uma entidade
// ---------------------------------------------------------------
function doGet(e) {
  try {
    initSheets();
    const entity = e.parameter.entity;
    const action = e.parameter.action;

    if (action === 'ping') {
      return corsResponse({ ok: true, message: 'API online' });
    }

    if (!entity || !SHEETS[entity]) {
      return corsResponse({ error: 'Entidade inválida. Use: units, teams ou cargos' });
    }

    const rows = getAll(entity);
    return corsResponse({ ok: true, data: rows });
  } catch (err) {
    return corsResponse({ error: err.message });
  }
}

// ---------------------------------------------------------------
// POST: cria, atualiza ou deleta registros
// ---------------------------------------------------------------
function doPost(e) {
  try {
    initSheets();
    const body = JSON.parse(e.postData.contents);
    const { action, entity, data, id } = body;

    if (!entity || !SHEETS[entity]) {
      return corsResponse({ error: 'Entidade inválida' });
    }

    switch (action) {
      case 'create':
        return corsResponse({ ok: true, data: createRecord(entity, data) });
      case 'update':
        return corsResponse({ ok: true, data: updateRecord(entity, id, data) });
      case 'delete':
        deleteRecord(entity, id);
        return corsResponse({ ok: true, deleted: id });
      case 'bulkCreate':
        const created = data.map(item => createRecord(entity, item));
        return corsResponse({ ok: true, data: created });
      case 'replaceAll':
        replaceAll(entity, data);
        return corsResponse({ ok: true, count: data.length });
      case 'deleteAll':
        deleteAll(entity);
        return corsResponse({ ok: true });
      default:
        return corsResponse({ error: 'Ação inválida: ' + action });
    }
  } catch (err) {
    return corsResponse({ error: err.message });
  }
}

// ---------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------

function getSheet(entity) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS[entity]);
}

function getAll(entity) {
  const sheet = getSheet(entity);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const headers = HEADERS[entity];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  return values
    .filter(row => row[0] !== '') // ignora linhas vazias
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i] === '' ? undefined : row[i];
        if (h === 'allowedMenus' || h === 'allowedUnits') {
          try {
            val = val ? JSON.parse(val) : [];
          } catch(e) {
            val = [];
          }
        }
        obj[h] = val;
      });
      return obj;
    });
}

function createRecord(entity, data) {
  const sheet = getSheet(entity);
  const headers = HEADERS[entity];
  const row = headers.map(h => {
    let val = data[h];
    if (h === 'allowedMenus' || h === 'allowedUnits') {
      val = val ? JSON.stringify(val) : '[]';
    }
    return val === undefined || val === null ? '' : val;
  });
  sheet.appendRow(row);
  return data;
}

function updateRecord(entity, id, data) {
  const sheet = getSheet(entity);
  const headers = HEADERS[entity];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const rowIndex = ids.indexOf(id);
  if (rowIndex === -1) return null;

  const sheetRow = rowIndex + 2;
  const row = headers.map(h => {
    let val = data[h];
    if (h === 'allowedMenus' || h === 'allowedUnits') {
      val = val ? JSON.stringify(val) : '[]';
    }
    return val === undefined || val === null ? '' : val;
  });
  sheet.getRange(sheetRow, 1, 1, headers.length).setValues([row]);
  return data;
}

function deleteRecord(entity, id) {
  const sheet = getSheet(entity);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const rowIndex = ids.indexOf(id);
  if (rowIndex !== -1) {
    sheet.deleteRow(rowIndex + 2);
  }
}

function replaceAll(entity, dataArray) {
  const sheet = getSheet(entity);
  const headers = HEADERS[entity];

  // Apaga tudo exceto o header
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  if (dataArray.length > 0) {
    const rows = dataArray.map(item =>
      headers.map(h => {
        let val = item[h];
        if (h === 'allowedMenus' || h === 'allowedUnits') {
          val = val ? JSON.stringify(val) : '[]';
        }
        return val === undefined || val === null ? '' : val;
      })
    );
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function deleteAll(entity) {
  const sheet = getSheet(entity);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}
