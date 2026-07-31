// ============================================
// KSLT Admin — Analytics Dashboard
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var chartsInstances = [];

    function destroyCharts() {
        chartsInstances.forEach(function(c) { if (c) c.destroy(); });
        chartsInstances = [];
    }

    function fmtNum(n) {
        return (n || 0).toLocaleString();
    }

    // ---- Section init ----
    function renderAnalyticsSection() {
        var container = document.getElementById('ad-analytics');
        if (!container) return;

        destroyCharts();

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + (A.SECTION_ICONS.analytics || '') + ' ' + L.analyticsTitle + '</h2>' +
            '</div>' +
            '<div class="ad-loading">' + L.saving + '</div>';

        loadAnalytics(container);
    }

    async function loadAnalytics(container) {
        // Parallel queries
        var results = await Promise.allSettled([
            A.client.rpc('get_analytics_overview'),                                                                      // [0]
            A.client.from('courts').select('id,name,view_count').order('view_count', { ascending: false }).limit(5),      // [1]
            A.client.from('coaches').select('id,name,view_count').order('view_count', { ascending: false }).limit(5),     // [2]
            A.client.from('news').select('id,title,view_count').order('view_count', { ascending: false }).limit(5),       // [3]
            A.client.from('tournaments').select('id,title,view_count').order('view_count', { ascending: false }).limit(5),// [4]
            A.client.from('sponsors').select('id,name,view_count').order('view_count', { ascending: false }).limit(5),    // [5]
            A.client.from('players').select('id,name,view_count').order('view_count', { ascending: false }).limit(5),     // [6]
            A.client.rpc('get_page_view_stats')                                                                          // [7]
        ]);

        var overview = getVal(results[0]);
        if (Array.isArray(overview)) overview = overview[0] || {};

        var topCourts = getArr(results[1]);
        var topCoaches = getArr(results[2]);
        var topNews = getArr(results[3]);
        var topTournaments = getArr(results[4]);
        var topSponsors = getArr(results[5]);
        var topPlayers = getArr(results[6]);
        var pageViews = getArr(results[7]);

        var entityTotal = (overview.courts_views || 0) + (overview.coaches_views || 0) +
            (overview.players_views || 0) + (overview.news_views || 0) +
            (overview.tournaments_views || 0) + (overview.sponsors_views || 0);

        // Find most popular type
        var typeData = [
            { label: isEn ? 'Courts' : 'Корты', value: overview.courts_views || 0 },
            { label: isEn ? 'Coaches' : 'Тренеры', value: overview.coaches_views || 0 },
            { label: isEn ? 'Players' : 'Игроки', value: overview.players_views || 0 },
            { label: isEn ? 'News' : 'Новости', value: overview.news_views || 0 },
            { label: isEn ? 'Tournaments' : 'Турниры', value: overview.tournaments_views || 0 },
            { label: isEn ? 'Sponsors' : 'Спонсоры', value: overview.sponsors_views || 0 }
        ];
        typeData.sort(function(a, b) { return b.value - a.value; });
        var mostPopular = typeData[0];

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + (A.SECTION_ICONS.analytics || '') + ' ' + L.analyticsTitle + '</h2>' +
            '</div>' +
            // Summary cards
            '<div class="anl-cards">' +
                buildCard('📊', fmtNum(entityTotal), L.anlEntityViews) +
                buildCard('📄', fmtNum(overview.pages_views || 0), L.anlPageViews) +
                buildCard('🔥', A.esc(mostPopular.label), L.anlMostPopular + ' (' + fmtNum(mostPopular.value) + ')') +
            '</div>' +
            // Views by type chart
            '<div class="anl-chart-card">' +
                '<div class="anl-chart-title">' + L.anlViewsByType + '</div>' +
                '<div class="anl-chart-wrap"><canvas id="anlTypeChart"></canvas></div>' +
            '</div>' +
            // Top-5 grids (2 columns)
            '<div class="anl-top-grid">' +
                buildTopCard('anlTopCourts', L.anlTopCourts, topCourts, 'name') +
                buildTopCard('anlTopCoaches', L.anlTopCoaches, topCoaches, 'name') +
                buildTopCard('anlTopNews', L.anlTopNews, topNews, 'title') +
                buildTopCard('anlTopTournaments', L.anlTopTournaments, topTournaments, 'title') +
                buildTopCard('anlTopSponsors', L.anlTopSponsors, topSponsors, 'name') +
                buildTopCard('anlTopPlayers', L.anlTopPlayers, topPlayers, 'name') +
            '</div>' +
            // Page views table
            '<div class="anl-chart-card">' +
                '<div class="anl-chart-title">' + L.anlPageViewsTable + '</div>' +
                buildPageViewsTable(pageViews) +
            '</div>';

        // Render charts
        renderTypeChart(typeData);
        renderTopCharts('anlTopCourts', topCourts, 'name');
        renderTopCharts('anlTopCoaches', topCoaches, 'name');
        renderTopCharts('anlTopNews', topNews, 'title');
        renderTopCharts('anlTopTournaments', topTournaments, 'title');
        renderTopCharts('anlTopSponsors', topSponsors, 'name');
        renderTopCharts('anlTopPlayers', topPlayers, 'name');
    }

    function buildCard(icon, value, label) {
        return '<div class="anl-card">' +
            '<div class="anl-card-icon">' + icon + '</div>' +
            '<div class="anl-card-value">' + value + '</div>' +
            '<div class="anl-card-label">' + label + '</div>' +
        '</div>';
    }

    function buildTopCard(canvasId, title, data, nameField) {
        if (!data.length) {
            return '<div class="anl-top-card">' +
                '<div class="anl-chart-title">' + title + '</div>' +
                '<div class="anl-empty">' + L.anlNoData + '</div>' +
            '</div>';
        }
        return '<div class="anl-top-card">' +
            '<div class="anl-chart-title">' + title + '</div>' +
            '<div class="anl-top-chart-wrap"><canvas id="' + canvasId + '"></canvas></div>' +
        '</div>';
    }

    function buildPageViewsTable(data) {
        if (!data.length) return '<div class="anl-empty">' + L.anlNoData + '</div>';
        var rows = '';
        data.forEach(function(p) {
            rows += '<tr>' +
                '<td>' + A.esc(p.page_name) + '</td>' +
                '<td style="text-align:right;font-weight:600;color:var(--accent)">' + fmtNum(p.view_count) + '</td>' +
            '</tr>';
        });
        return '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
            '<th>' + (isEn ? 'Page' : 'Страница') + '</th>' +
            '<th style="text-align:right">' + (isEn ? 'Views' : 'Просмотры') + '</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    // ---- Charts ----

    function renderTypeChart(typeData) {
        var canvas = document.getElementById('anlTypeChart');
        if (!canvas || typeof Chart === 'undefined') return;

        var labels = typeData.map(function(d) { return d.label; });
        var values = typeData.map(function(d) { return d.value; });

        var colors = [
            '#CCFF00', '#00E5FF', '#FF6D00', '#E040FB', '#76FF03', '#FFD600'
        ];

        var chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(20,20,30,0.95)',
                        titleColor: '#CCFF00',
                        bodyColor: '#fff',
                        borderColor: 'rgba(204,255,0,0.3)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: 'rgba(255,255,255,0.5)' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 13 } }
                    }
                }
            }
        });
        chartsInstances.push(chart);
    }

    function renderTopCharts(canvasId, data, nameField) {
        var canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined' || !data.length) return;

        var labels = data.map(function(d) {
            var name = d[nameField] || '—';
            return name.length > 25 ? name.substring(0, 22) + '...' : name;
        });
        var values = data.map(function(d) { return d.view_count || 0; });

        var chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: 'rgba(204,255,0,0.25)',
                    borderColor: '#CCFF00',
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(20,20,30,0.95)',
                        titleColor: '#CCFF00',
                        bodyColor: '#fff'
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: 'rgba(255,255,255,0.5)' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } }
                    }
                }
            }
        });
        chartsInstances.push(chart);
    }

    // ---- Helpers ----
    function getVal(r) {
        return (r.status === 'fulfilled' && r.value.data) ? r.value.data : {};
    }
    function getArr(r) {
        return (r.status === 'fulfilled' && r.value.data) ? r.value.data : [];
    }

    // ---- Exports ----
    A.renderAnalyticsSection = renderAnalyticsSection;

})();
