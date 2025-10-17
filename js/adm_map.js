let geojsonData = null;
let gemeenteGronden = {};
let chart = null;
let grondListFilled = false;
const deelnameKleur = '#7b68ee'; // Paars voor gemeenten met gegevens
const waardeKleuren = {
    0: '#d73027',
    1: '#fc8d59',
    2: '#fee08b',
    3: '#91cf60',
    4: '#4575b4',
    null: '#cccccc'
};
const waardeLabels = {
    0: 'Geen beleid',
    1: 'Wel beleid, geen prioriteit',
    2: 'Wel beleid, lage prioriteit',
    3: 'Wel beleid, hoge prioriteit',
    4: 'Wel beleid, prioriteit onbekend'
};

Promise.all([
    fetch(geojsonUrl).then(res => res.json()),
    fetch(ajaxurl + '?action=haal_gemeente_grond_op').then(res => res.json())
])
    .then(([geoData, gronden]) => {
        geojsonData = geoData;
        gemeenteGronden = gronden;
        renderDataOnly(true, true); // 👉 standaard de 'met gegevens'-kaart tonen
        buildCategoriePie();

    })
    .catch(err => console.error('Fout bij laden GeoJSON of data:', err));

function renderMap(activeGrond = null) {
    const mapData = geojsonData.features.map(feature => {
        const code = feature.properties.statcode;
        const gemeenteData = gemeenteGronden[code];
        const naam = gemeenteData?.naam || feature.properties.statnaam || 'Onbekend';
        const grondenObj = gemeenteData?.gronden || {};
        const waarde = activeGrond && grondenObj[activeGrond] !== undefined ? grondenObj[activeGrond] : null;
        const kleur = waardeKleuren.hasOwnProperty(waarde) ? waardeKleuren[waarde] : waardeKleuren.null;

        return {
            code,
            value: waarde,
            name: naam,
            gronden: grondenObj,
            color: kleur   // 🔹 belangrijk!
        };
    });


    chart = Highcharts.mapChart('grond-map', {
        chart: { map: geojsonData, backgroundColor: 'transparent' },
        title: { text: activeGrond ? `Beleid voor discriminatie op grond van: ${activeGrond}` : '' },
        legend: { enabled: false },
        credits: { enabled: false },
        tooltip: {
            formatter: function () {
                const naam = this.point.name;
                const waarde = this.point.value;
                const label = waardeLabels[waarde] || 'Geen gegevens';
                if (activeGrond) {
                    return `<b>${naam}</b><br/>${activeGrond}: <b>${label}</b>`;
                } else {
                    const lijst = Object.entries(this.point.gronden || {})
                        .map(([grond, val]) => `${grond}: ${waardeLabels[val] || 'Geen gegevens'}`)
                        .join('<br/>');
                    return `<b>${naam}</b><br/>${lijst || 'Geen gegevens'}`;
                }
            }
        },
        series: [{
            data: mapData,
            keys: ['code', 'value', 'name', 'gronden', 'color'],
            joinBy: ['statcode', 'code'],
            name: 'Gemeente',
            borderColor: '#999',
            nullColor: '#cccccc',
            states: { hover: { color: '#a55cc5' } },
            dataLabels: { enabled: false }
        }]
    });

    document.getElementById('grond-map').classList.add('loaded');

    if (!grondListFilled) {
        buildGrondButtons();
        buildCategoriePie();
        buildLegenda();
        //buildKleurenschaal();
        grondListFilled = true;
    }


}
function renderDataOnly(showOnlyWithData, isInitial = false) {
    if (!geojsonData || !gemeenteGronden) return; // veiligheidscheck

    if (!showOnlyWithData) {
        renderMap(null);
        return;
    }

    const mapData = geojsonData.features.map(feature => {
        const code = feature.properties.statcode;
        const gemeenteData = gemeenteGronden[code];
        const naam = gemeenteData?.naam || feature.properties.statnaam || 'Onbekend';
        const grondenObj = gemeenteData?.gronden || {};
        const heeftData = Object.keys(grondenObj).length > 0;

        return {
            code,
            value: heeftData ? 1 : null,
            name: naam,
            color: heeftData ? deelnameKleur : waardeKleuren.null,
            opacity: heeftData ? 1 : 0.55
        };
    });

    chart = Highcharts.mapChart('grond-map', {
        chart: { map: geojsonData, backgroundColor: 'transparent' },
        title: { text: isInitial ? '' : 'Deelnemende gegevens' },
        credits: { enabled: false },

        tooltip: {
            useHTML: true,
            borderRadius: 6,
            borderWidth: 0,
            backgroundColor: 'rgba(255,255,255,0.95)',
            shadow: { color: 'rgba(0,0,0,0.2)', width: 2, offsetX: 2, offsetY: 2 },
            style: {
                color: '#222',
                fontSize: '13px',
                fontFamily: 'Inter, Roboto, Arial, sans-serif',
                lineHeight: '1.4em',
                padding: '6px 8px'
            },
            formatter: function () {
                const heeftData = this.point.value === 1;
                const naam = this.point.name;
                const header = `<div style="font-weight:600;font-size:14px;margin-bottom:4px;">${naam}</div>`;
                const tekst = heeftData
                    ? `<div style="color:#222;">Deed mee aan de monitor</div>`
                    : `<div style="color:#777;">Deed niet mee aan de monitor</div>`;
                return header + tekst;
            }
        },

        series: [{
            data: mapData,
            keys: ['code', 'value', 'name', 'color', 'opacity'],
            joinBy: ['statcode', 'code'],
            name: 'Gemeente',
            borderColor: '#999',
            nullColor: '#cccccc',
            states: {
                hover: {
                    color: '#a55cc5',
                    opacity: 1
                }
            },
            dataLabels: { enabled: false },
            opacity: 1,
            point: {
                events: {
                    mouseOver: function () {
                        this.update({ opacity: 1 }, false);
                    },
                    mouseOut: function () {
                        if (this.options.value === null) {
                            this.update({ opacity: 0.55 }, false);
                        }
                    }
                }
            }
        }]
    });

    // Bouw knoppen en legenda slechts één keer
    if (!grondListFilled) {
        buildGrondButtons();
        buildLegenda();
        //buildKleurenschaal();
        grondListFilled = true;
    }
}
function buildGrondButtons() {
    const grondList = document.getElementById('grond-list');
    if (!grondList) {
        console.warn('⚠️ Element #grond-list niet gevonden');
        return;
    }
    grondList.innerHTML = '';

    // Verzamel alle unieke gronden
    const gronden = new Set();
    Object.values(gemeenteGronden || {}).forEach(gem => {
        Object.keys(gem.gronden || {}).forEach(g => gronden.add(g));
    });

    // Voor elke grond een knop met WordPress-stijl
    Array.from(gronden).sort().forEach(grond => {
        const btn = document.createElement('button');
        btn.textContent = grond;
        //btn.classList.add('button'); // ✅ standaard WP-knopstijl
        btn.style.display = 'block';
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.style.marginBottom = '4px';

        btn.addEventListener('click', function () {
            const actief = btn.dataset.active === 'true';
            grondList.querySelectorAll('button').forEach(b => {
                delete b.dataset.active;
                //b.classList.remove('button-primary');
                //b.classList.add('button');
            });

            if (!actief) {
                btn.dataset.active = 'true';
                //btn.classList.remove('button');
                //btn.classList.add('button-primary'); // ✅ actieve WP-stijl (blauw)
                renderMap(grond);
                buildCategoriePie(grond);
            } else {
                delete btn.dataset.active;
                //btn.classList.remove('button-primary');
                //btn.classList.add('button');
                renderDataOnly(true);
                buildCategoriePie(null);
            }
        });

        grondList.appendChild(btn);
    });

    // Extra knop: Gemeenten met gegevens
    const btnData = document.createElement('button');
    btnData.textContent = 'Gemeenten die deelnamen';
    //btnData.classList.add('button', 'button-primary'); // ✅ standaard actief
    btnData.style.display = 'block';
    btnData.style.width = '100%';
    btnData.style.textAlign = 'left';
    btnData.dataset.active = 'true';

    btnData.addEventListener('click', function () {
        const actief = btnData.dataset.active === 'true';
        grondList.querySelectorAll('button').forEach(b => {
            delete b.dataset.active;
            //b.classList.remove('button-primary');
            //b.classList.add('button');
        });

        if (!actief) {
            btnData.dataset.active = 'true';
            //btnData.classList.remove('button');
            //btnData.classList.add('button-primary');
            renderDataOnly(true);
            buildCategoriePie(null);
        } else {
            // tweede klik: blijf op deze weergave, niets wissen
            btnData.dataset.active = 'true';
            //btnData.classList.remove('button');
            //btnData.classList.add('button-primary');
            renderDataOnly(true);
            buildCategoriePie(null);
        }
    });

    grondList.appendChild(btnData);
}
function buildLegenda() {
    const container = document.getElementById('grond-legenda');
    if (!container) return;

    container.innerHTML = '<h3>Legenda</h3>';
    container.style.padding = "15px";
    Object.entries(waardeLabels).forEach(([val, label]) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.marginBottom = '4px';
        item.innerHTML = `<span style="width:20px;height:20px;background:${waardeKleuren[val]};display:inline-block;margin-right:8px;border:1px solid #999"></span>${label}`;
        container.appendChild(item);
    });
    const grijs = document.createElement('div');
    grijs.style.display = 'flex';
    grijs.style.alignItems = 'center';
    grijs.innerHTML = `<span style="top:10px;width:20px;height:20px;background:${waardeKleuren.null};display:inline-block;margin-right:8px;border:1px solid #999"></span>Geen gegevens`;
    container.appendChild(grijs);
}
function buildKleurenschaal() {
    const container = document.getElementById('grond-schaal');
    if (!container) return;

    container.innerHTML = ''; // Reset

    // Titel boven de schaal
    const titel = document.createElement('div');
    titel.textContent = 'Beleidsstatus per grond';
    titel.style.fontWeight = 'bold';
    titel.style.marginBottom = '6px';
    container.appendChild(titel);

    // De gekleurde gradient-balk
    const schaalBalk = document.createElement('div');
    schaalBalk.style.height = '20px';
    schaalBalk.style.width = '100%';
    schaalBalk.style.maxWidth = '400px';
    schaalBalk.style.border = '1px solid #888';
    schaalBalk.style.borderRadius = '4px';
    schaalBalk.style.background = `
        linear-gradient(to right,
            ${waardeKleuren[0]} 0%,
            ${waardeKleuren[1]} 25%,
            ${waardeKleuren[2]} 50%,
            ${waardeKleuren[3]} 75%,
            ${waardeKleuren[4]} 100%)
    `;
    container.appendChild(schaalBalk);

    // Labels onder de balk
    const labels = document.createElement('div');
    labels.style.display = 'flex';
    labels.style.justifyContent = 'space-between';
    labels.style.maxWidth = '400px';
    labels.style.fontSize = '0.85em';
    labels.style.marginTop = '4px';
    labels.innerHTML = `
        <span>Geen beleid</span>
        <span>Geen prioriteit</span>
        <span>Lage prioriteit</span>
        <span>Hoge prioriteit</span>
        <span>Onbekende prioriteit</span>
    `;
    container.appendChild(labels);

    // Extra label voor gemeenten zonder data
    const grijs = document.createElement('div');
    grijs.style.display = 'flex';
    grijs.style.alignItems = 'center';
    grijs.style.marginTop = '8px';
    grijs.style.fontSize = '0.85em';
    grijs.innerHTML = `
        <span style="display:inline-block;width:20px;height:20px;background:${waardeKleuren.null};
        border:1px solid #888;margin-right:6px;border-radius:3px;"></span>Geen gegevens beschikbaar
    `;
    container.appendChild(grijs);
}
function buildCategoriePie(selectedGrond = null) {
    if (!gemeenteGronden || Object.keys(gemeenteGronden).length === 0) return;

    let data = [];
    let titleText = '';

    if (selectedGrond === null) {
        // 🔹 STARTMODUS: gemeenten met / zonder gegevens
        if (!geojsonData) return;

        const totaal = geojsonData.features.length;
        const met = Object.keys(gemeenteGronden).length;
        const zonder = Math.max(totaal - met, 0);

        data = [
            {
                name: `Gemeenten met gegevens (${met}/${totaal})`,
                y: met,
                color: deelnameKleur || '#7cb5ec',
                uitleg: 'Gemeenten die hebben meegedaan aan de monitor'
            },
            {
                name: `Geen gegevens beschikbaar (${zonder}/${totaal})`,
                y: zonder,
                color: '#cccccc',
                uitleg: 'Gemeenten waarvoor (nog) geen deelnamegegevens beschikbaar zijn'
            }
        ];

        titleText = 'Gemeenten met / zonder gegevens';
    } else {
        // 🔹 GROND-MODUS: verdeling binnen één grond
        const freq = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

        Object.values(gemeenteGronden).forEach(gem => {
            const gronden = gem.gronden || {};
            const v = gronden[selectedGrond];
            if (v !== undefined && v !== null && freq.hasOwnProperty(v)) freq[v]++;
        });

        data = Object.entries(freq).map(([val, count]) => ({
            name: waardeLabels[val],
            y: count,
            color: waardeKleuren[val],
            uitleg: waardeLabels[val] // handig voor tooltip
        })).filter(d => d.y > 0);

        titleText = `Verdeling binnen "${selectedGrond}"`;
    }

    // 🔁 Update bestaande chart als die er al is
    const existing = Highcharts.charts.find(c => c && c.renderTo.id === 'grond-pie');
    if (existing) {
        existing.setTitle({ text: titleText });
        existing.series[0].setData(data, true);
        return;
    }

    // 🆕 Anders nieuwe piechart tekenen
    Highcharts.chart('grond-pie', {
        chart: {
            type: 'pie',
            backgroundColor: 'transparent',
            height: 200
        },
        title: {
            text: titleText,
            align: 'center',
            style: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,1)' }
        },
        credits: { enabled: false },
        exporting: { enabled: false },
        tooltip: {
            useHTML: true,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderWidth: 0,
            borderRadius: 6,
            style: { fontSize: '13px', color: '#222' },
            formatter: function () {
                const pct = Highcharts.numberFormat(this.point.percentage, 1);
                const uitleg = this.point.uitleg ? `<div style="color:#555;">${this.point.uitleg}</div>` : '';
                return `<b>${this.point.name}</b><br/>${this.point.y} gemeenten<br/>(${pct}%)${uitleg}`;
            }
        },
        plotOptions: {
            pie: {
                innerSize: '50%',
                dataLabels: {
                    enabled: true,
                    distance: 10,
                    format: '{point.percentage:.1f}%',
                    style: { fontSize: '11px', color: '#333' }
                },
                borderWidth: 0
            }
        },
        series: [{ name: 'Gemeenten', data }]
    });
}

setTimeout(() => { if (chart && chart.reflow) chart.reflow(); }, 0);
window.addEventListener('resize', () => { if (chart && chart.reflow) chart.reflow(); });



