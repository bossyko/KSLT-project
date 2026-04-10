// ============================================
// KSLT Mobile — News Screen
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var N = window.KSLT_NEWS = {};
  var allNews = [];
  var currentTag = 'all';
  var currentSearch = '';

  N.load = function() {
    if (!supabaseClient) return;
    var el = document.getElementById('newsList');
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('news')
      .select('*')
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(function(r) {
        allNews = r.data || [];
        render();
      });

    initSearch();
  };

  N.filter = function(tag) {
    currentTag = tag;
    render();
  };

  function initSearch() {
    var input = document.getElementById('newsSearch');
    if (!input || input._bound) return;
    input._bound = true;
    var timer = null;
    input.addEventListener('input', function() {
      var q = this.value.trim().toLowerCase();
      clearTimeout(timer);
      timer = setTimeout(function() {
        currentSearch = q;
        render();
      }, 300);
    });
  }

  function render() {
    var el = document.getElementById('newsList');
    var filtered = allNews;
    if (currentTag !== 'all') {
      filtered = filtered.filter(function(n) {
        return (n.category || '').toLowerCase().indexOf(currentTag) !== -1;
      });
    }
    if (currentSearch) {
      filtered = filtered.filter(function(n) {
        return (n.title || '').toLowerCase().indexOf(currentSearch) !== -1 ||
               (n.excerpt || '').toLowerCase().indexOf(currentSearch) !== -1;
      });
    }

    if (filtered.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📰</div><div class="empty-title">' + I18N.t('news.empty') + '</div><div class="empty-text">' +
        (currentSearch ? I18N.t('news.emptySearch') : I18N.t('news.emptyFilter')) + '</div></div>';
      return;
    }

    var months = I18N.months();
    var html = '';
    filtered.forEach(function(n) {
      var d = new Date(n.created_at);
      var dateStr = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
      var bgStyle = n.image ? 'background-image:url(' + n.image + ');background-size:cover;background-position:center' : '';
      html += '<div class="news-list-item" data-news-id="' + n.id + '">' +
        '<div class="news-list-img"' + (bgStyle ? ' style="' + bgStyle + '"' : '') + '>' +
          (n.image ? '' : '<span class="news-list-img-icon">📰</span>') +
        '</div>' +
        '<div class="news-list-body">' +
          '<div class="news-list-tag">' + esc(n.category || I18N.t('news.default')) + '</div>' +
          '<div class="news-list-title">' + esc(n.title) + '</div>' +
          '<div class="news-list-excerpt">' + esc(n.excerpt || '') + '</div>' +
          '<div class="news-list-footer">' +
            '<span>' + dateStr + '</span>' +
            '<span>' + (n.views || 0) + ' ' + I18N.t('news.views') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    el.innerHTML = html;

    // Click → open news detail overlay (uses HOME's overlay)
    el.querySelectorAll('.news-list-item[data-news-id]').forEach(function(item) {
      item.addEventListener('click', function() {
        var nid = item.getAttribute('data-news-id');
        if (nid && window.KSLT_HOME && window.KSLT_HOME.openNewsDetail) {
          window.KSLT_HOME.openNewsDetail(nid);
        }
      });
    });
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

})();
