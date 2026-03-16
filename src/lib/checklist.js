// Чеклист проверки
export const CHECKLIST = [
  // 1.x — Математические ошибки
  { id:"1.1", cat:"Математические ошибки", name:"Сумма цифрами ≠ прописью", w:10 },
  { id:"1.2", cat:"Математические ошибки", name:"Ошибка в подсчёте итоговой суммы", w:10 },
  { id:"1.3", cat:"Математические ошибки", name:"Неверный расчёт НДС", w:10 },
  { id:"1.4", cat:"Математические ошибки", name:"Ошибка в количестве × цену", w:10 },
  { id:"1.5", cat:"Математические ошибки", name:"Несоответствие скидки", w:5 },
  { id:"1.6", cat:"Математические ошибки", name:"Округление с большой погрешностью", w:5 },

  // 2.x — Реквизиты и оформление
  { id:"2.1", cat:"Реквизиты и оформление", name:"Неверный формат ИНН/КПП", w:10 },
  { id:"2.2", cat:"Реквизиты и оформление", name:"QR-код: сумма отличается от счёта", w:10 },
  { id:"2.3", cat:"Реквизиты и оформление", name:"QR-код не считывается", w:10 },

  // 3.x — Технические несоответствия
  { id:"3.1", cat:"Технические несоответствия", name:"Нереалистичные сроки поставки", w:10 },
  { id:"3.3", cat:"Технические несоответствия", name:"Нереальная скидка (>30–40%)", w:10 },
  { id:"3.5", cat:"Технические несоответствия", name:"Неверные тех. характеристики", w:5 },

  // 4.x — Качество оформления
  { id:"4.1", cat:"Качество оформления", name:"Грамматические ошибки", w:2 },
  { id:"4.4", cat:"Качество оформления", name:"Признаки редактирования (Photoshop)", w:10 },
  { id:"4.6", cat:"Качество оформления", name:"Разные версии документа", w:10 },

  // 5.x — Проверка компании
  { id:"5.1", cat:"Проверка компании", name:"Компания не найдена в ЕГРЮЛ", w:10 },
  { id:"5.2", cat:"Проверка компании", name:"Компания ликвидирована", w:10 },

  // 6.x — Форензика: детекция подделки
  { id:"6.1", cat:"Форензика: детекция подделки", name:"Создано в графическом/PDF-редакторе", w:10 },
  { id:"6.2", cat:"Форензика: детекция подделки", name:"Дата создания ≠ дата изменения", w:7 },
  { id:"6.3", cat:"Форензика: детекция подделки", name:"Множественные ревизии PDF", w:8 },
  { id:"6.4", cat:"Форензика: детекция подделки", name:"Разные шрифты/размеры в числах", w:10 },
  { id:"6.5", cat:"Форензика: детекция подделки", name:"Нарушение выравнивания текста/цифр", w:8 },
  { id:"6.6", cat:"Форензика: детекция подделки", name:"Артефакты сжатия вокруг текста", w:9 },
  { id:"6.7", cat:"Форензика: детекция подделки", name:"Замазывание/закрашивание областей", w:10 },
  { id:"6.8", cat:"Форензика: детекция подделки", name:"Несовпадение фона под текстом", w:9 },
  { id:"6.9", cat:"Форензика: детекция подделки", name:"Редактируемые поля или JavaScript в PDF", w:7 },
  { id:"6.10", cat:"Форензика: детекция подделки", name:"Инкрементальное обновление PDF", w:6 },
];

// Парсинг числа из строки
function parseNum(s) {
  if (!s && s !== 0) return null;
  const str = String(s).replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function fmtNum(n) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Клиентская проверка математики (JS считает без ошибок)
export function verifyMath(extracted, checks) {
  if (!extracted?.items?.length) return checks;
  const updated = [...checks];

  function setCheck(id, status, comment) {
    const idx = updated.findIndex(c => c.id === id);
    if (idx >= 0) updated[idx] = { ...updated[idx], id, status, comment };
  }

  const items = extracted.items.map((it, i) => ({
    idx: i + 1, name: it.name,
    qty: parseNum(it.qty), price: parseNum(it.price), sum: parseNum(it.sum),
  }));

  const totalDoc = parseNum(extracted.total_sum);
  const ndsDoc = parseNum(extracted.nds_sum);

  // 1.4: qty × price = sum
  const lineErrors = [], lineDetails = [];
  items.forEach(it => {
    if (it.qty !== null && it.price !== null && it.sum !== null) {
      const calc = Math.round(it.qty * it.price * 100) / 100;
      const diff = Math.abs(calc - it.sum);
      const ok = diff <= 5;
      lineDetails.push(`${it.idx}) ${it.qty}×${it.price}=${fmtNum(calc)}${ok ? "✓" : ` (указано ${fmtNum(it.sum)}, Δ${fmtNum(diff)})✗`}`);
      if (!ok) lineErrors.push(it.idx);
    }
  });
  if (lineDetails.length > 0) {
    setCheck("1.4", lineErrors.length > 0 ? "fail" : "ok",
      lineDetails.join("; ") + (lineErrors.length > 0 ? `. Ошибки в строках: ${lineErrors.join(", ")}` : ". Все строки верны."));
  }

  // 1.2: sum of line sums = total
  const lineSums = items.filter(it => it.sum !== null).map(it => it.sum);
  if (lineSums.length > 0 && totalDoc !== null) {
    const calcTotal = Math.round(lineSums.reduce((a, b) => a + b, 0) * 100) / 100;
    const diff = Math.abs(calcTotal - totalDoc);
    setCheck("1.2", diff <= 1 ? "ok" : "fail",
      `${lineSums.map(s => fmtNum(s)).join(" + ")} = ${fmtNum(calcTotal)}. В документе: ${fmtNum(totalDoc)}. Разница: ${fmtNum(diff)}`);
  }

  // 1.3: VAT check (supports 22%, 20%, 10%, 0%)
  if (totalDoc !== null && ndsDoc !== null) {
    // Try common Russian VAT rates
    const rates = [
      { rate: 22, div: 122 },
      { rate: 20, div: 120 },
      { rate: 10, div: 110 },
    ];
    let bestMatch = null, bestDiff = Infinity;
    for (const r of rates) {
      const calc = Math.round(totalDoc * r.rate / r.div * 100) / 100;
      const d = Math.abs(calc - ndsDoc);
      if (d < bestDiff) { bestDiff = d; bestMatch = { ...r, calc }; }
    }
    if (bestMatch) {
      setCheck("1.3", bestDiff <= 1 ? "ok" : "fail",
        `${fmtNum(totalDoc)} × ${bestMatch.rate} ÷ ${bestMatch.div} = ${fmtNum(bestMatch.calc)}. В документе: ${fmtNum(ndsDoc)}. Разница: ${fmtNum(bestDiff)}`);
    }
  } else if (!ndsDoc) {
    setCheck("1.3", "skip", "НДС не указан.");
  }

  // 1.6: rounding > 10₽
  const bigRound = items.filter(it => {
    if (it.qty !== null && it.price !== null && it.sum !== null) {
      return Math.abs(Math.round(it.qty * it.price * 100) / 100 - it.sum) > 10;
    }
    return false;
  });
  if (items.filter(it => it.qty !== null).length > 0) {
    setCheck("1.6", bigRound.length > 0 ? "warn" : "ok",
      bigRound.length > 0 ? `Округление >10₽ в строках: ${bigRound.map(it => it.idx).join(", ")}` : "Все округления в норме.");
  }

  return updated;
}

// Серверная проверка форензики (детерминистическая)
export function verifyForensics(forensicData, checks) {
  if (!forensicData) return checks;
  const updated = [...checks];

  function setCheck(id, status, comment) {
    const idx = updated.findIndex(c => c.id === id);
    if (idx >= 0) updated[idx] = { ...updated[idx], id, status, comment };
  }

  // 6.1: Suspicious software
  if (forensicData.suspiciousSoftware) {
    setCheck("6.1", "fail",
      `Документ создан/обработан в ${forensicData.suspiciousSoftwareName}. ` +
      `Легитимные документы создаются в учётных системах (1С, SAP, Word, Excel), а не в графических редакторах.`
    );
  } else if (forensicData.creator || forensicData.producer) {
    setCheck("6.1", "ok",
      `Создатель: ${forensicData.creator || "—"}, движок: ${forensicData.producer || "—"}`
    );
  } else {
    setCheck("6.1", "skip", "Метаданные создателя не найдены.");
  }

  // 6.2: Date mismatch
  if (forensicData.dateMismatch) {
    const severity = forensicData.dateMismatchDays > 7 ? "fail" : "warn";
    setCheck("6.2", severity,
      `Создан: ${forensicData.creationDate}, изменён: ${forensicData.modDate} — ` +
      `разница ${forensicData.dateMismatchDays} дн. ` +
      (forensicData.dateMismatchDays > 7
        ? "Значительная разница указывает на позднее редактирование."
        : "Небольшая разница, возможно доработка.")
    );
  } else if (forensicData.creationDate) {
    setCheck("6.2", "ok", "Даты создания и изменения совпадают.");
  } else {
    setCheck("6.2", "skip", "Даты в метаданных не найдены.");
  }

  // 6.3: Multiple revisions
  if (forensicData.revisionCount > 3) {
    setCheck("6.3", "fail",
      `Обнаружено ${forensicData.revisionCount} ревизий. Многократное редактирование — высокий риск изменения содержимого.`
    );
  } else if (forensicData.revisionCount > 1) {
    setCheck("6.3", "warn",
      `Обнаружено ${forensicData.revisionCount} ревизии. Файл редактировался после первоначального создания.`
    );
  } else {
    setCheck("6.3", "ok", "Одна ревизия — файл не перезаписывался.");
  }

  // 6.9: Form fields or JavaScript
  if (forensicData.hasJavaScript) {
    setCheck("6.9", "fail", "Документ содержит JavaScript — может манипулировать отображаемыми данными.");
  } else if (forensicData.hasFormFields) {
    setCheck("6.9", "warn", "Документ содержит редактируемые поля формы — значения могут быть изменены.");
  } else {
    setCheck("6.9", "ok", "Нет редактируемых полей или скриптов.");
  }

  // 6.10: Incremental updates
  const hasIncremental = forensicData.flags?.some(f => f.includes("инкрементальное"));
  if (hasIncremental) {
    setCheck("6.10", "warn",
      "PDF содержит инкрементальные обновления — файл дописывался после первоначального сохранения. " +
      "Это типичный признак редактирования PDF-редактором."
    );
  } else if (forensicData.revisionCount <= 1) {
    setCheck("6.10", "ok", "Нет инкрементальных обновлений.");
  }

  // For image uploads: check editing software in EXIF
  if (forensicData.editingSoftwareDetected) {
    setCheck("6.1", "fail",
      `В метаданных изображения обнаружен ${forensicData.editingSoftwareName}. ` +
      `Фотография/скан обрабатывалась в графическом редакторе.`
    );
  }

  return updated;
}

// Расчёт итогового балла
export function calcScore(checks) {
  let mx = 0, earn = 0;
  checks.forEach(c => {
    const d = CHECKLIST.find(x => x.id === c.id);
    if (!d || c.status === "skip") return;
    mx += d.w;
    if (c.status === "ok") earn += d.w;
    else if (c.status === "warn") earn += d.w * 0.5;
  });
  return mx > 0 ? Math.round(earn / mx * 100) : 50;
}
