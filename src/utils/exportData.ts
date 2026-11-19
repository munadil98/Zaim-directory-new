/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Contact } from '../data/initialContacts';
import type { AmelaMember } from '../data/centralAmela';

export type DirectoryViewType = 'directory' | 'amela' | 'district-nazem' | 'region-nazem';

export interface DistrictNazemRow {
  district: string;
  name: string;
  mobile: string;
  region?: string;
}

export interface RegionNazemRow {
  region: string;
  name: string;
  mobile: string;
}

interface ExportPayload {
  view: DirectoryViewType;
  contacts?: Contact[];
  amelaContacts?: AmelaMember[];
  districtNazems?: DistrictNazemRow[];
  regionNazems?: RegionNazemRow[];
  selectedRegion?: string | null;
  selectedDistrict?: string | null;
  showFavoritesOnly?: boolean;
}

function buildRows(payload: ExportPayload): {
  sheetName: string;
  filePrefix: string;
  rows: Array<Record<string, string>>;
} {
  const { view } = payload;

  if (view === 'directory') {
    const items = payload.contacts || [];
    return {
      sheetName: 'Zaeem Directory',
      filePrefix: 'zaeem-directory',
      rows: items.map((c, idx) => ({
        'SL (ক্রমিক)': c.sl || String(idx + 1),
        'Majlis (মজলিস)': c.majlis || '',
        'Name (নাম)': c.name || '',
        'Mobile (মোবাইল)': c.mobile || '',
        'District (জেলা)': c.district || '',
        'District Nazem (জেলা নাযেম)': c.districtNazem || '',
        'District Nazem Mobile': c.districtNazemMobile || '',
        'Region (রিজিওন)': c.region || '',
        'Region Nazem (রিজিওন নাযেম)': c.regionNazem || '',
        'Region Nazem Mobile': c.regionNazemMobile || '',
      })),
    };
  }

  if (view === 'amela') {
    const items = payload.amelaContacts || [];
    return {
      sheetName: 'Central Amela',
      filePrefix: 'central-amela',
      rows: items.map((c, idx) => ({
        'SL (ক্রমিক)': c.sl || String(idx + 1),
        'Name (নাম)': c.name || '',
        'Designation (পদবী)': c.designation || '',
        'Mobile (মোবাইল)': c.mobile || '',
      })),
    };
  }

  if (view === 'district-nazem') {
    const items = payload.districtNazems || [];
    return {
      sheetName: 'District Nazem',
      filePrefix: 'district-nazem-directory',
      rows: items.map((n, idx) => ({
        'SL (ক্রমিক)': String(idx + 1),
        'District (জেলা)': n.district || '',
        'Name (নাম)': n.name || '',
        'Mobile (মোবাইল)': n.mobile || '',
        'Region (রিজিওন)': n.region || '',
      })),
    };
  }

  const items = payload.regionNazems || [];
  return {
    sheetName: 'Region Nazem',
    filePrefix: 'region-nazem-directory',
    rows: items.map((n, idx) => ({
      'SL (ক্রমিক)': String(idx + 1),
      'Region (রিজিওন)': n.region || '',
      'Name (নাম)': n.name || '',
      'Mobile (মোবাইল)': n.mobile || '',
    })),
  };
}

function buildFilename(
  filePrefix: string,
  ext: 'xlsx' | 'csv',
  options: Pick<ExportPayload, 'selectedRegion' | 'selectedDistrict' | 'showFavoritesOnly'>
): string {
  const parts = [filePrefix];
  if (options.selectedDistrict) {
    parts.push('filtered-district');
  } else if (options.selectedRegion) {
    parts.push('filtered-region');
  }
  if (options.showFavoritesOnly) {
    parts.push('favorites');
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  parts.push(dateStr);
  return `${parts.join('-')}.${ext}`;
}

export function exportFilteredDirectory(format: 'xlsx' | 'csv', payload: ExportPayload): number {
  const { sheetName, filePrefix, rows } = buildRows(payload);
  if (rows.length === 0) return 0;

  const filename = buildFilename(filePrefix, format, payload);

  if (format === 'csv') {
    const csvContent = Papa.unparse(rows, { quotes: true });
    // Prepend UTF-8 BOM so Microsoft Excel preserves Bengali Unicode characters cleanly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return rows.length;
  }

  // Excel (.xlsx) export using SheetJS
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const headers = Object.keys(rows[0] || {});
  worksheet['!cols'] = headers.map((header) => {
    const maxLen = rows.reduce((max, row) => {
      const val = String(row[header] ?? '');
      return Math.max(max, val.length);
    }, header.length);
    return { wch: Math.min(Math.max(maxLen + 4, 14), 42) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
  return rows.length;
}
