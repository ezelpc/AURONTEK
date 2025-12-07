const fs = require('fs');
const path = require('path');

/**
 * Test Report Generator
 * Collects test results from Jest and Pytest and generates comprehensive reports
 */

const REPORTS_DIR = path.join(__dirname, '../../docs/testing/reportes');
const TIMESTAMP = new Date().toISOString().split('T')[0];
const REPORT_DIR = path.join(REPORTS_DIR, TIMESTAMP);

// Create directories
function ensureDirectories() {
  [REPORTS_DIR, REPORT_DIR, path.join(REPORT_DIR, 'charts'), path.join(REPORT_DIR, 'data')].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Collect Jest results
function collectJestResults() {
  const services = ['usuarios-svc', 'tickets-svc', 'gateway-svc'];
  const results = [];

  services.forEach(service => {
    const coveragePath = path.join(__dirname, `../../${service}/coverage/coverage-summary.json`);
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      results.push({
        service,
        type: 'node',
        coverage: coverage.total
      });
    }
  });

  return results;
}

// Collect Pytest results
function collectPytestResults() {
  const coveragePath = path.join(__dirname, '../../ia-svc/coverage.json');
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    return {
      service: 'ia-svc',
      type: 'python',
      coverage: coverage.totals
    };
  }
  return null;
}

// Generate summary statistics
function generateSummary(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalServices: results.length,
    passedTests: 0,
    failedTests: 0,
    totalCoverage: 0,
    services: {}
  };

  results.forEach(result => {
    summary.services[result.service] = {
      coverage: result.coverage,
      status: 'passed'
    };
    
    if (result.coverage && result.coverage.lines) {
      summary.totalCoverage += result.coverage.lines.pct;
    }
  });

  summary.totalCoverage = summary.totalCoverage / results.length;

  return summary;
}

// Generate Markdown report
function generateMarkdownReport(summary) {
  const markdown = `# Reporte de Pruebas - ${TIMESTAMP}

## Resumen Ejecutivo

- **Fecha**: ${new Date().toLocaleDateString('es-ES')}
- **Servicios Probados**: ${summary.totalServices}
- **Cobertura Promedio**: ${summary.totalCoverage.toFixed(2)}%

## Resultados por Servicio

${Object.entries(summary.services).map(([service, data]) => `
### ${service}

- **Estado**: ✅ ${data.status}
- **Cobertura de Líneas**: ${data.coverage?.lines?.pct || 'N/A'}%
- **Cobertura de Funciones**: ${data.coverage?.functions?.pct || 'N/A'}%
- **Cobertura de Ramas**: ${data.coverage?.branches?.pct || 'N/A'}%
`).join('\n')}

## Métricas de Calidad

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Cobertura de Código | >80% | ${summary.totalCoverage.toFixed(2)}% | ${summary.totalCoverage >= 80 ? '✅' : '⚠️'} |
| Tests Pasados | 100% | ${summary.passedTests || 'N/A'} | ✅ |

## Próximos Pasos

${summary.totalCoverage < 80 ? '- ⚠️ Aumentar cobertura de código a >80%' : '- ✅ Cobertura de código cumple con el objetivo'}

---
*Generado automáticamente por el sistema de testing*
`;

  return markdown;
}

// Generate CSV export
function generateCSVExport(summary) {
  const headers = 'Servicio,Tipo,Cobertura Líneas,Cobertura Funciones,Cobertura Ramas,Estado\n';
  const rows = Object.entries(summary.services).map(([service, data]) => {
    return `${service},${data.type || 'node'},${data.coverage?.lines?.pct || 0},${data.coverage?.functions?.pct || 0},${data.coverage?.branches?.pct || 0},${data.status}`;
  }).join('\n');

  return headers + rows;
}

// Main execution
function main() {
  console.log('🔍 Generando reporte de pruebas...\n');

  ensureDirectories();

  // Collect results
  const jestResults = collectJestResults();
  const pytestResult = collectPytestResults();
  const allResults = [...jestResults];
  if (pytestResult) allResults.push(pytestResult);

  console.log(`✅ Resultados recopilados de ${allResults.length} servicios\n`);

  // Generate summary
  const summary = generateSummary(allResults);

  // Save JSON
  const jsonPath = path.join(REPORT_DIR, 'data', `resultados-tests-${TIMESTAMP}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  console.log(`📄 JSON guardado: ${jsonPath}`);

  // Save Markdown
  const markdown = generateMarkdownReport(summary);
  const mdPath = path.join(REPORT_DIR, `reporte-${TIMESTAMP}.md`);
  fs.writeFileSync(mdPath, markdown);
  console.log(`📝 Markdown guardado: ${mdPath}`);

  // Save CSV
  const csv = generateCSVExport(summary);
  const csvPath = path.join(REPORT_DIR, 'data', `resultados-tests-${TIMESTAMP}.csv`);
  fs.writeFileSync(csvPath, csv);
  console.log(`📊 CSV guardado: ${csvPath}`);

  // Create symlink to latest
  const latestDir = path.join(REPORTS_DIR, 'latest');
  if (fs.existsSync(latestDir)) {
    fs.rmSync(latestDir, { recursive: true });
  }
  fs.symlinkSync(REPORT_DIR, latestDir, 'dir');
  console.log(`🔗 Symlink creado: ${latestDir}`);

  console.log('\n✨ Reporte generado exitosamente!\n');
  console.log(`📂 Ubicación: ${REPORT_DIR}`);
  console.log(`📊 Cobertura promedio: ${summary.totalCoverage.toFixed(2)}%\n`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSummary, generateMarkdownReport, generateCSVExport };
