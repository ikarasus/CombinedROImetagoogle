/* ============================================================
   roi-calculator.js
   Google Ads & Meta Ads Combined ROI Calculator — IDR
   ============================================================ */

(function () {
  'use strict';

  let chartInstance = null;

  /* ── Formatters ─────────────────────────────────────────── */

  /**
   * Format a number as compact Indonesian Rupiah.
   * e.g. 5000 → "Rp 5rb", 2500000 → "Rp 2,5 jt"
   */
  function fc(n) {
    const r = Math.round(n);
    const a = Math.abs(r);
    const s = r < 0 ? '-' : '';
    if (a >= 1e9) return s + 'Rp\u00a0' + (a / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '\u00a0M';
    if (a >= 1e6) return s + 'Rp\u00a0' + (a / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '\u00a0jt';
    if (a >= 1e3) return s + 'Rp\u00a0' + (a / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '\u00a0rb';
    return s + 'Rp\u00a0' + a.toLocaleString('id-ID');
  }

  /**
   * Format a number as locale-aware integer string.
   * e.g. 1234 → "1.234"
   */
  function fn(n) {
    return Math.round(n).toLocaleString('id-ID');
  }

  /**
   * Format a number as a percentage string.
   * e.g. 320 → "320%"
   */
  function fp(n) {
    return Math.round(n).toLocaleString('id-ID') + '%';
  }

  /**
   * Format a number for chart Y-axis ticks (compact IDR).
   */
  function fAxis(v) {
    const a = Math.abs(v);
    const s = v < 0 ? '-' : '';
    if (a >= 1e9) return s + 'Rp\u00a0' + (a / 1e9).toFixed(1) + '\u00a0M';
    if (a >= 1e6) return s + 'Rp\u00a0' + (a / 1e6).toFixed(0) + '\u00a0jt';
    if (a >= 1e3) return s + 'Rp\u00a0' + (a / 1e3).toFixed(0) + '\u00a0rb';
    return s + 'Rp\u00a0' + a;
  }

  /* ── Helpers ─────────────────────────────────────────────── */

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? +el.value : 0;
  }

  /**
   * Set ROI element text + colour based on the ROI value.
   */
  function applyRoiColor(el, value) {
    if (!el) return;
    el.textContent = fp(value);
    if (value >= 100) {
      el.style.color = '#166534'; /* green */
    } else if (value >= 0) {
      el.style.color = '#92400E'; /* amber */
    } else {
      el.style.color = '#991B1B'; /* red */
    }
  }

  /* ── Core calculation ────────────────────────────────────── */

  function calc() {
    /* --- Read inputs --- */
    const gcpc   = getVal('g-cpc');
    const gbud   = getVal('g-bud');
    const gconv  = getVal('g-conv');
    const mcpc   = getVal('m-cpc');
    const mbud   = getVal('m-bud');
    const mconv  = getVal('m-conv');
    const close  = getVal('s-close');
    const ltv    = getVal('s-ltv');
    const margin = getVal('s-margin');

    /* --- Sync slider display values --- */
    setText('gv-cpc',    fc(gcpc));
    setText('gv-bud',    fc(gbud));
    setText('gv-conv',   gconv.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%');
    setText('mv-cpc',    fc(mcpc));
    setText('mv-bud',    fc(mbud));
    setText('mv-conv',   mconv.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%');
    setText('sv-close',  close + '%');
    setText('sv-ltv',    fc(ltv));
    setText('sv-margin', margin + '%');

    /* --- Google Ads --- */
    const gVisits  = gcpc > 0 ? gbud / gcpc : 0;
    const gLeads   = gVisits * (gconv / 100);
    const gCpl     = gLeads > 0 ? gbud / gLeads : 0;
    const gSales   = gLeads * (close / 100);
    const gRevenue = gSales * ltv;
    const gProfit  = gRevenue * (margin / 100) - gbud;
    const gRoi     = gbud > 0 ? ((gRevenue - gbud) / gbud) * 100 : 0;

    /* --- Meta Ads --- */
    const mClicks  = mcpc > 0 ? mbud / mcpc : 0;
    const mLeads   = mClicks * (mconv / 100);
    const mCpl     = mLeads > 0 ? mbud / mLeads : 0;
    const mSales   = mLeads * (close / 100);
    const mRevenue = mSales * ltv;
    const mProfit  = mRevenue * (margin / 100) - mbud;
    const mRoi     = mbud > 0 ? ((mRevenue - mbud) / mbud) * 100 : 0;

    /* --- Combined --- */
    const totalBudget  = gbud + mbud;
    const totalRevenue = gRevenue + mRevenue;
    const totalProfit  = gProfit + mProfit;
    const combinedRoi  = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0;

    /* --- Update Google breakdown --- */
    setText('g-vis',   fn(gVisits));
    setText('g-leads', fn(gLeads));
    setText('g-cpl',   fc(gCpl));
    setText('g-sales', fn(gSales));
    setText('g-rev',   fc(gRevenue));
    setText('g-pro',   fc(gProfit));
    applyRoiColor(document.getElementById('g-roi-hd'), gRoi);

    /* --- Update Meta breakdown --- */
    setText('m-vis',   fn(mClicks));
    setText('m-leads', fn(mLeads));
    setText('m-cpl',   fc(mCpl));
    setText('m-sales', fn(mSales));
    setText('m-rev',   fc(mRevenue));
    setText('m-pro',   fc(mProfit));
    applyRoiColor(document.getElementById('m-roi-hd'), mRoi);

    /* --- Update combined summary --- */
    setText('c-bud', fc(totalBudget));
    setText('c-rev', fc(totalRevenue));
    setText('c-pro', fc(totalProfit));
    applyRoiColor(document.getElementById('c-roi'), combinedRoi);

    /* --- Assessment & chart --- */
    updateAssessment(combinedRoi, gRoi, mRoi);
    updateChart(gbud, gRevenue, gProfit, mbud, mRevenue, mProfit, totalBudget, totalRevenue, totalProfit);
  }

  /* ── Assessment banner ───────────────────────────────────── */

  function updateAssessment(combinedRoi, gRoi, mRoi) {
    const box   = document.getElementById('abox');
    const title = document.getElementById('atitle');
    const body  = document.getElementById('abody');
    if (!box || !title || !body) return;

    const r      = Math.round(combinedRoi);
    const better = gRoi >= mRoi ? 'Google Ads' : 'Meta Ads';
    const worse  = gRoi >= mRoi ? 'Meta Ads'   : 'Google Ads';

    /* Reset classes */
    box.className = 'assessment';

    if (combinedRoi >= 300) {
      box.classList.add('success');
      title.textContent = 'Highly profitable: ' + r.toLocaleString('id-ID') + '% combined ROI';
      body.textContent  =
        'Your combined Google Ads + Meta Ads strategy is delivering exceptional returns. ' +
        better + ' is your stronger channel at ' + fp(Math.max(gRoi, mRoi)) + ' ROI. ' +
        'Consider scaling both budgets — with priority on ' + better +
        ' — to capture more market share.';

    } else if (combinedRoi >= 100) {
      box.classList.add('success');
      title.textContent = 'Profitable: ' + r.toLocaleString('id-ID') + '% combined ROI';
      body.textContent  =
        better + ' is outperforming ' + worse + ' (' +
        fp(Math.max(gRoi, mRoi)) + ' vs ' + fp(Math.min(gRoi, mRoi)) + ' ROI). ' +
        'Consider reallocating budget toward ' + better +
        ' and improving ad creative and landing page conversion on ' + worse + '.';

    } else if (combinedRoi >= 0) {
      box.classList.add('warning');
      title.textContent = 'Break-even: ' + r.toLocaleString('id-ID') + '% combined ROI';
      body.textContent  =
        'Your combined ad spend is barely covering costs. Focus on improving conversion ' +
        'rates and close rates before increasing budgets. Even a 1–2% lift in lead ' +
        'conversion can meaningfully shift your combined ROI.';

    } else {
      box.classList.add('danger');
      title.textContent = 'Unprofitable: ' + r.toLocaleString('id-ID') + '% combined ROI';
      body.textContent  =
        'At these numbers, your combined ad investment is not profitable. Reduce CPC ' +
        'through better quality scores and ad creative, improve landing page conversion, ' +
        'or reassess your customer lifetime value before committing further budget.';
    }
  }

  /* ── Chart (Chart.js grouped bar) ───────────────────────── */

  function updateChart(gbud, grev, gpro, mbud, mrev, mpro, tbud, trev, tpro) {
    const canvas = document.getElementById('roi-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx   = canvas.getContext('2d');
    const gData = [gbud, grev, gpro];
    const mData = [mbud, mrev, mpro];
    const cData = [tbud, trev, tpro];

    if (chartInstance) {
      chartInstance.data.datasets[0].data = gData;
      chartInstance.data.datasets[1].data = mData;
      chartInstance.data.datasets[2].data = cData;
      chartInstance.update('none');
      return;
    }

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Ad budget', 'Revenue', 'Profit'],
        datasets: [
          {
            label: 'Google Ads',
            data: gData,
            backgroundColor: '#378ADD',
            hoverBackgroundColor: '#185FA5',
            borderRadius: 5,
            borderSkipped: false
          },
          {
            label: 'Meta Ads',
            data: mData,
            backgroundColor: '#7F77DD',
            hoverBackgroundColor: '#533AB7',
            borderRadius: 5,
            borderSkipped: false
          },
          {
            label: 'Combined',
            data: cData,
            backgroundColor: '#B4B2A9',
            hoverBackgroundColor: '#888780',
            borderRadius: 5,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            padding: 10,
            callbacks: {
              label: function (ctx) {
                return '  ' + ctx.dataset.label + ': ' + fc(ctx.raw);
              }
            }
          }
        },
        scales: {
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawTicks: false
            },
            border: {
              display: false
            },
            ticks: {
              padding: 8,
              font: {
                size: 11,
                family: "'Plus Jakarta Sans', system-ui, sans-serif"
              },
              color: '#9CA3AF',
              callback: fAxis
            }
          },
          x: {
            grid: {
              display: false
            },
            border: {
              display: false
            },
            ticks: {
              padding: 6,
              font: {
                size: 12,
                family: "'Plus Jakarta Sans', system-ui, sans-serif"
              },
              color: '#6B7280'
            }
          }
        }
      }
    });
  }

  /* ── Wire up events & initialise ─────────────────────────── */

  function init() {
    var sliderIds = [
      'g-cpc', 'g-bud', 'g-conv',
      'm-cpc', 'm-bud', 'm-conv',
      's-close', 's-ltv', 's-margin'
    ];

    sliderIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', calc);
    });

    var dlBtn = document.getElementById('btn-download-pdf');
    if (dlBtn) dlBtn.addEventListener('click', downloadPDF);

    calc();
  }

  /* ── PDF export ───────────────────────────────────────────── */

  /** Sanitise DOM text — strip non-breaking spaces, trim. */
  function txt(el) {
    return el ? el.textContent.replace(/\u00a0/g, ' ').trim() : '';
  }

  /** Collect all displayed values from the DOM. */
  function readCurrentValues() {
    return {
      gCpcDisp:   txt(document.getElementById('gv-cpc')),
      gBudDisp:   txt(document.getElementById('gv-bud')),
      gConvDisp:  txt(document.getElementById('gv-conv')),
      mCpcDisp:   txt(document.getElementById('mv-cpc')),
      mBudDisp:   txt(document.getElementById('mv-bud')),
      mConvDisp:  txt(document.getElementById('mv-conv')),
      closeDisp:  txt(document.getElementById('sv-close')),
      ltvDisp:    txt(document.getElementById('sv-ltv')),
      marginDisp: txt(document.getElementById('sv-margin')),
      gVis:       txt(document.getElementById('g-vis')),
      gLeads:     txt(document.getElementById('g-leads')),
      gCpl:       txt(document.getElementById('g-cpl')),
      gSales:     txt(document.getElementById('g-sales')),
      gRev:       txt(document.getElementById('g-rev')),
      gPro:       txt(document.getElementById('g-pro')),
      gRoiHd:     txt(document.getElementById('g-roi-hd')),
      mVis:       txt(document.getElementById('m-vis')),
      mLeads:     txt(document.getElementById('m-leads')),
      mCpl:       txt(document.getElementById('m-cpl')),
      mSales:     txt(document.getElementById('m-sales')),
      mRev:       txt(document.getElementById('m-rev')),
      mPro:       txt(document.getElementById('m-pro')),
      mRoiHd:     txt(document.getElementById('m-roi-hd')),
      cBud:       txt(document.getElementById('c-bud')),
      cRev:       txt(document.getElementById('c-rev')),
      cPro:       txt(document.getElementById('c-pro')),
      cRoi:       txt(document.getElementById('c-roi'))
    };
  }

  /** Draw a small all-caps section label. */
  function pdfLabel(doc, text, x, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(text, x, y);
  }

  /** Entry point — show loading state, then generate. */
  function downloadPDF() {
    var btn = document.getElementById('btn-download-pdf');
    if (!btn) return;

    btn.classList.add('loading');
    btn.disabled = true;
    var label = btn.querySelector('.btn-label');
    if (label) label.textContent = 'Generating…';

    /* Small timeout so the browser can repaint the button before the
       synchronous PDF work blocks the thread. */
    setTimeout(function () {
      try {
        buildPDF();
      } catch (err) {
        console.error('PDF generation error:', err);
        alert('Could not generate PDF — please try again.');
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
        if (label) label.textContent = 'Download PDF';
      }
    }, 60);
  }

  /** Build and save the PDF. */
  function buildPDF() {
    var jsPDFLib = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDFLib) {
      alert('PDF library not loaded. Check your internet connection and refresh the page.');
      return;
    }

    var doc = new jsPDFLib({ orientation: 'p', unit: 'mm', format: 'a4' });

    /* ── Page constants ── */
    var PW = 210, PH = 297;
    var ML = 18, MR = 18;
    var CW = PW - ML - MR;            /* 174 mm content width */
    var colW = (CW - 6) / 2;          /* two equal columns with 6 mm gap */
    var y = 0;

    var d    = readCurrentValues();
    var now  = new Date();
    var dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    var timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    /* ── Header bar ───────────────────────────────────────────── */
    doc.setFillColor(24, 95, 165);
    doc.rect(0, 0, PW, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Digital Ads ROI Report', ML, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(dateStr + '  ' + timeStr, PW - MR, 15, { align: 'right' });

    y = 32;

    /* ── Input summary ────────────────────────────────────────── */
    pdfLabel(doc, 'INPUT SUMMARY', ML, y);
    y += 6;

    /* Google input box */
    doc.setFillColor(235, 244, 255);
    doc.rect(ML, y, colW, 28, 'F');
    doc.setFillColor(24, 95, 165);
    doc.rect(ML, y, 3, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(24, 95, 165);
    doc.text('Google Ads', ML + 7, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text('CPC: ' + d.gCpcDisp,              ML + 7,          y + 14);
    doc.text('Monthly budget: ' + d.gBudDisp,   ML + 7,          y + 21);
    doc.text('Conv. rate: ' + d.gConvDisp,       ML + colW/2 + 3, y + 14);
    doc.text('Platform: Google Search',          ML + colW/2 + 3, y + 21);

    /* Meta input box */
    var mx = ML + colW + 6;
    doc.setFillColor(238, 237, 254);
    doc.rect(mx, y, colW, 28, 'F');
    doc.setFillColor(83, 58, 183);
    doc.rect(mx, y, 3, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(83, 58, 183);
    doc.text('Meta Ads', mx + 7, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text('CPC: ' + d.mCpcDisp,              mx + 7,          y + 14);
    doc.text('Monthly budget: ' + d.mBudDisp,   mx + 7,          y + 21);
    doc.text('Conv. rate: ' + d.mConvDisp,       mx + colW/2 + 3, y + 14);
    doc.text('Platform: Facebook / Instagram',   mx + colW/2 + 3, y + 21);

    y += 32;

    /* Shared inputs strip */
    doc.setFillColor(249, 250, 251);
    doc.rect(ML, y, CW, 12, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.rect(ML, y, CW, 12, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Shared inputs:', ML + 4, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Close rate ' + d.closeDisp,    ML + 32,  y + 7.5);
    doc.text('LTV ' + d.ltvDisp,             ML + 80,  y + 7.5);
    doc.text('Margin ' + d.marginDisp,       ML + 130, y + 7.5);

    y += 20;

    /* ── Combined results ─────────────────────────────────────── */
    pdfLabel(doc, 'COMBINED RESULTS', ML, y);
    y += 6;

    var boxW = (CW - 9) / 4;
    var boxH = 22;
    var summaries = [
      { label: 'TOTAL BUDGET',  val: d.cBud, accent: false },
      { label: 'TOTAL REVENUE', val: d.cRev, accent: false },
      { label: 'TOTAL PROFIT',  val: d.cPro, accent: false },
      { label: 'COMBINED ROI',  val: d.cRoi, accent: true  }
    ];

    summaries.forEach(function (m, i) {
      var bx = ML + i * (boxW + 3);
      if (m.accent) {
        doc.setFillColor(24, 95, 165);
      } else {
        doc.setFillColor(245, 246, 247);
      }
      doc.rect(bx, y, boxW, boxH, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(m.accent ? 180 : 107, m.accent ? 210 : 114, m.accent ? 255 : 128);
      doc.text(m.label, bx + boxW / 2, y + 6.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(m.accent ? 14 : 10);
      doc.setTextColor(m.accent ? 255 : 17, m.accent ? 255 : 24, m.accent ? 255 : 39);
      doc.text(m.val, bx + boxW / 2, y + 16, { align: 'center' });
    });

    y += boxH + 10;

    /* ── Platform breakdowns ──────────────────────────────────── */
    pdfLabel(doc, 'PLATFORM BREAKDOWN', ML, y);
    y += 6;

    var rowH   = 7.5;
    var hdrH   = 9;
    var breaks = [
      {
        label: 'Google Ads',
        color: [24, 95, 165],
        light: [235, 244, 255],
        roi: d.gRoiHd,
        rows: [
          ['Visits',   d.gVis],
          ['Leads',    d.gLeads],
          ['CPL',      d.gCpl],
          ['Sales',    d.gSales],
          ['Revenue',  d.gRev],
          ['Profit',   d.gPro]
        ]
      },
      {
        label: 'Meta Ads',
        color: [83, 58, 183],
        light: [238, 237, 254],
        roi: d.mRoiHd,
        rows: [
          ['Clicks',   d.mVis],
          ['Leads',    d.mLeads],
          ['CPL',      d.mCpl],
          ['Sales',    d.mSales],
          ['Revenue',  d.mRev],
          ['Profit',   d.mPro]
        ]
      }
    ];

    breaks.forEach(function (section, si) {
      var bx = si === 0 ? ML : ML + colW + 6;

      /* Header */
      doc.setFillColor(section.color[0], section.color[1], section.color[2]);
      doc.rect(bx, y, colW, hdrH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(section.label, bx + 5, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('ROI: ' + section.roi, bx + colW - 4, y + 6, { align: 'right' });

      /* Rows */
      section.rows.forEach(function (row, ri) {
        var ry  = y + hdrH + ri * rowH;
        var bg  = ri % 2 === 0 ? section.light : [255, 255, 255];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(bx, ry, colW, rowH, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text(row[0], bx + 4, ry + 5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(row[1], bx + colW - 4, ry + 5, { align: 'right' });
      });
    });

    y += hdrH + 6 * rowH + 10;

    /* ── Assessment ───────────────────────────────────────────── */
    pdfLabel(doc, 'ASSESSMENT', ML, y);
    y += 6;

    var assessEl  = document.getElementById('abox');
    var titleText = txt(document.getElementById('atitle'));
    var bodyText  = txt(document.getElementById('abody'));

    var aFill   = [240, 253, 244];
    var aBorder = [134, 239, 172];
    var aAccent = [22,  163, 74];
    var aText   = [22,  101, 52];

    if (assessEl && assessEl.classList.contains('warning')) {
      aFill = [255, 251, 235]; aBorder = [252, 211, 77];
      aAccent = [217, 119, 6]; aText = [146, 64, 14];
    } else if (assessEl && assessEl.classList.contains('danger')) {
      aFill = [254, 242, 242]; aBorder = [252, 165, 165];
      aAccent = [220, 38, 38]; aText = [153, 27, 27];
    }

    var bodyLines = doc.splitTextToSize(bodyText, CW - 12);
    var assessH   = 10 + bodyLines.length * 5.5 + 6;

    doc.setFillColor(aFill[0], aFill[1], aFill[2]);
    doc.rect(ML, y, CW, assessH, 'F');
    doc.setDrawColor(aBorder[0], aBorder[1], aBorder[2]);
    doc.setLineWidth(0.4);
    doc.rect(ML, y, CW, assessH, 'S');
    doc.setFillColor(aAccent[0], aAccent[1], aAccent[2]);
    doc.rect(ML, y, 3, assessH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(aText[0], aText[1], aText[2]);
    doc.text(titleText, ML + 7, y + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    bodyLines.forEach(function (line, li) {
      doc.text(line, ML + 7, y + 14 + li * 5.5);
    });

    y += assessH + 10;

    /* ── Chart ────────────────────────────────────────────────── */
    var chartCanvas = document.getElementById('roi-chart');
    if (chartCanvas) {
      var aspect  = chartCanvas.width / chartCanvas.height;
      var chartW  = CW;
      var chartH  = Math.round(chartW / aspect);

      if (y + chartH + 14 > PH - 18) {
        doc.addPage();
        y = 20;
      }

      pdfLabel(doc, 'BUDGET vs REVENUE vs PROFIT — COMPARISON CHART', ML, y);
      y += 5;

      /* legend */
      var lgItems = [
        { label: 'Google Ads', color: [55, 138, 221] },
        { label: 'Meta Ads',   color: [127, 119, 221] },
        { label: 'Combined',   color: [136, 135, 128] }
      ];
      var lgX = ML;
      lgItems.forEach(function (lg) {
        doc.setFillColor(lg.color[0], lg.color[1], lg.color[2]);
        doc.rect(lgX, y, 3, 3, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text(lg.label, lgX + 5, y + 2.8);
        lgX += 28;
      });
      y += 7;

      var imgData = chartCanvas.toDataURL('image/png', 1.0);
      doc.addImage(imgData, 'PNG', ML, y, chartW, chartH);
      y += chartH;
    }

    /* ── Footer ────────────────────────────────────────────────── */
    var footerY = PH - 11;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(ML, footerY - 4, PW - MR, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text('Digital Ads ROI Calculator  —  ' + dateStr, ML, footerY);
    doc.text('Results are projections based on the input values provided.', PW - MR, footerY, { align: 'right' });

    /* ── Save ──────────────────────────────────────────────────── */
    doc.save('ROI-Report-' + now.toISOString().slice(0, 10) + '.pdf');
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
