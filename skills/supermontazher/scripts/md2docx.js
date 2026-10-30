// Переводит markdown-файл в .docx.  Запуск: node md2docx.js вход.md выход.docx
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, AlignmentType,
} = require("docx");

const [, , src, out] = process.argv;
const lines = fs.readFileSync(src, "utf8").replace(/\r/g, "").split("\n");

const FONT = "Calibri";
const PAGE_W = 11906 - 2 * 1134; // A4 минус поля по 2 см

// **жирный**, *курсив*, `код` -> набор TextRun
function runs(text, base = {}) {
  const res = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) res.push(new TextRun({ text: text.slice(last, m.index), font: FONT, ...base }));
    const t = m[0];
    if (t.startsWith("**")) res.push(new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, ...base }));
    else if (t.startsWith("`")) res.push(new TextRun({ text: t.slice(1, -1), font: "Consolas", ...base }));
    else res.push(new TextRun({ text: t.slice(1, -1), italics: true, font: FONT, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) res.push(new TextRun({ text: text.slice(last), font: FONT, ...base }));
  return res;
}

const quoteBorder = { left: { style: BorderStyle.SINGLE, size: 18, color: "2E75B6", space: 10 } };
const children = [];
let i = 0;
let numRef = 0;

while (i < lines.length) {
  const line = lines[i];

  if (!line.trim()) { i++; continue; }

  // заголовки
  const h = line.match(/^(#{1,3})\s+(.*)$/);
  if (h) {
    const level = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][h[1].length - 1];
    children.push(new Paragraph({ heading: level, children: runs(h[2]) }));
    i++; continue;
  }

  // горизонтальная черта
  if (/^---+$/.test(line.trim())) {
    children.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF", space: 1 } },
      spacing: { before: 120, after: 240 }, children: [],
    }));
    i++; continue;
  }

  // блок кода
  if (line.startsWith("```")) {
    i++;
    while (i < lines.length && !lines[i].startsWith("```")) {
      children.push(new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
        indent: { left: 200, right: 200 }, spacing: { after: 0, line: 276 },
        children: [new TextRun({ text: lines[i] || " ", font: FONT, size: 21 })],
      }));
      i++;
    }
    i++;
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    continue;
  }

  // таблица
  if (line.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
    const rows = [];
    const parse = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    rows.push(parse(line));
    i += 2;
    while (i < lines.length && lines[i].startsWith("|")) { rows.push(parse(lines[i])); i++; }
    const n = rows[0].length;
    // ширина колонок по самой длинной ячейке, но не уже 9% и не шире 55%
    const maxLen = Array.from({ length: n }, (_, c) => Math.max(...rows.map((r) => (r[c] || "").length), 3));
    let w = maxLen.map((l) => Math.min(Math.max(l, 6), 60));
    const sum = w.reduce((a, b) => a + b, 0);
    w = w.map((x) => Math.floor((x / sum) * PAGE_W));
    w[n - 1] += PAGE_W - w.reduce((a, b) => a + b, 0);
    const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
    children.push(new Table({
      width: { size: PAGE_W, type: WidthType.DXA },
      columnWidths: w,
      rows: rows.map((r, ri) => new TableRow({
        tableHeader: ri === 0,
        children: Array.from({ length: n }, (_, c) => new TableCell({
          width: { size: w[c], type: WidthType.DXA },
          borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          shading: ri === 0 ? { type: ShadingType.CLEAR, fill: "DEEAF6" } : undefined,
          children: [new Paragraph({ spacing: { after: 0 }, children: runs(r[c] || "", ri === 0 ? { bold: true, size: 20 } : { size: 20 }) })],
        })),
      })),
    }));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    continue;
  }

  // цитата: текст под запись и примечания
  if (line.startsWith(">")) {
    while (i < lines.length && lines[i].startsWith(">")) {
      const t = lines[i].replace(/^>\s?/, "");
      if (t.trim()) {
        children.push(new Paragraph({
          border: quoteBorder, indent: { left: 340 }, spacing: { after: 140, line: 312 },
          children: runs(t, { size: 24 }),
        }));
      }
      i++;
    }
    continue;
  }

  // нумерованный список
  if (/^\d+\.\s/.test(line)) {
    numRef++;
    while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
      children.push(new Paragraph({
        numbering: { reference: "num" + numRef, level: 0 }, spacing: { after: 80 },
        children: runs(lines[i].replace(/^\d+\.\s+/, "")),
      }));
      i++;
    }
    continue;
  }

  // маркированный список
  if (/^[-—]\s/.test(line)) {
    while (i < lines.length && /^[-—]\s/.test(lines[i])) {
      children.push(new Paragraph({
        numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 },
        children: runs(lines[i].replace(/^[-—]\s+/, "")),
      }));
      i++;
    }
    continue;
  }

  // «На экране:» — пометка для монтажа
  if (line.startsWith("*На экране:*")) {
    children.push(new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: "FFF2CC" },
      indent: { left: 340 }, spacing: { before: 60, after: 200 },
      children: [
        new TextRun({ text: "На экране: ", bold: true, font: FONT, size: 20 }),
        ...runs(line.replace("*На экране:*", "").trim(), { size: 20 }),
      ],
    }));
    i++; continue;
  }

  // обычный абзац
  children.push(new Paragraph({ spacing: { after: 140 }, children: runs(line) }));
  i++;
}

const numbering = {
  config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] },
    ...Array.from({ length: Math.max(numRef, 1) }, (_, k) => ({
      reference: "num" + (k + 1),
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 300 } } } }],
    })),
  ],
};

const doc = new Document({
  numbering,
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 40, bold: true, color: "1F3864" }, paragraph: { spacing: { after: 240 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 30, bold: true, color: "1F3864" }, paragraph: { spacing: { before: 320, after: 160 } } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 25, bold: true, color: "2E75B6" }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log(`${out}: ${children.length} блоков, ${(buf.length / 1024).toFixed(0)} КБ`);
});
