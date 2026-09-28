// Searchable table of the simulation object dataset, showing which of the
// selected persona's preferences apply to each object.
//
// Matching mirrors hlag's ObjectPropertyPreference.obj_is_applicable: a rule
// applies when the object has ALL of the rule's categories and NONE of its
// negative_categories. Every applicable rule is shown; none takes precedence.

$(document).ready(function() {
  var $viewer = $('#object-viewer');
  if ($viewer.length === 0) {
    return;
  }

  var DATA_DIR = './static/assets/data';
  var PERSONA_FILES = ['persona_1.json', 'persona_2.json', 'persona_3.json'];

  var $rows = $('#object-viewer-rows');
  var $search = $('#object-viewer-search');
  var $count = $('#object-viewer-count');

  var objects = [];   // [{name, cats}]
  var personas = [];
  var active = 0;

  function escapeHtml(text) {
    return $('<div>').text(text).html();
  }

  function applies(rule, cats) {
    var required = rule.categories || [];
    var excluded = rule.negative_categories || [];
    return required.every(function(c) { return cats.indexOf(c) !== -1; }) &&
           excluded.every(function(c) { return cats.indexOf(c) === -1; });
  }

  function matching(rules, cats) {
    return (rules || []).filter(function(rule) { return applies(rule, cats); });
  }

  // Display strings for each preference family, following how
  // env_utils.get_persona_from_config turns persona JSON into preferences.
  function preferencesFor(persona, cats) {
    var high = persona.high_level || {};
    var low = persona.low_level || {};

    return {
      receptacle: matching(high.cleanup_receptacles, cats).map(function(r) {
        return r.receptacle === null ? null : r.receptacle;
      }),
      order: matching(high.cleanup_order, cats).map(function(r) {
        return 'Clean up ' + r.order;
      }),
      grasp: matching(low.pick, cats).map(function(r) {
        return [r.grasp_type, r.grasp_speed].filter(Boolean).join(', ');
      }),
      place: matching(low.place, cats).map(function(r) { return r.place_type; }),
      nav: matching(low.goto, cats).map(function(r) {
        return r.node === null ? 'Optimal route' : 'Avoid node ' + r.node;
      })
    };
  }

  function cell(values) {
    if (values.length === 0) {
      return '<td class="has-text-grey-light">&mdash;</td>';
    }
    return '<td>' + values.map(function(v) {
      // A null receptacle is the validity preference: leave the object alone.
      return v === null
        ? '<span class="object-viewer-skip">Not cleaned up</span>'
        : escapeHtml(v);
    }).join('<br>') + '</td>';
  }

  function render() {
    var persona = personas[active];
    var hasOrder = (persona.high_level.cleanup_order || []).length > 0;

    var html = objects.map(function(obj) {
      var prefs = preferencesFor(persona, obj.cats);
      var tags = obj.cats.map(function(c) {
        return '<span class="tag is-light" data-category="' + escapeHtml(c) + '">' +
               escapeHtml(c) + '</span>';
      }).join('');
      return '<tr>' +
        '<td>' + escapeHtml(obj.name) + '</td>' +
        '<td>' + tags + '</td>' +
        cell(prefs.receptacle) +
        (hasOrder ? cell(prefs.order) : '') +
        cell(prefs.grasp) +
        cell(prefs.place) +
        cell(prefs.nav) +
        '</tr>';
    }).join('');

    $rows.html(html);
    $viewer.find('th.object-viewer-order').toggle(hasOrder);
    filter();
  }

  // Comma-separated terms; each must be a substring of the object's name or
  // one of its categories, so multi-word categories like "formal wear" work.
  function filter() {
    var terms = $search.val().toLowerCase().split(',')
      .map(function(t) { return t.trim(); })
      .filter(Boolean);

    var shown = 0;
    $rows.children('tr').each(function(i) {
      var obj = objects[i];
      var haystack = [obj.name].concat(obj.cats).map(function(s) { return s.toLowerCase(); });
      var visible = terms.every(function(term) {
        return haystack.some(function(s) { return s.indexOf(term) !== -1; });
      });
      $(this).toggle(visible);
      if (visible) {
        shown++;
      }
    });
    $count.text('Showing ' + shown + ' of ' + objects.length + ' objects');
  }

  var requests = [$.getJSON(DATA_DIR + '/objects.json')].concat(
    PERSONA_FILES.map(function(f) { return $.getJSON(DATA_DIR + '/personas/' + f); }));

  $.when.apply($, requests).done(function(objectsResp) {
    objects = $.map(objectsResp[0], function(cats, name) {
      return {name: name, cats: cats};
    });
    personas = Array.prototype.slice.call(arguments, 1).map(function(resp) { return resp[0]; });
    render();
  }).fail(function() {
    $count.text('Could not load the object dataset. If you opened this page from disk, ' +
                'serve it over HTTP instead (e.g. python3 -m http.server).');
  });

  $('#object-viewer-personas li').on('click', function() {
    active = Number($(this).data('persona'));
    $(this).addClass('is-active').siblings().removeClass('is-active');
    if (personas.length) {
      render();
    }
  });

  $search.on('input', filter);

  // Clicking a category tag adds it to the search as another term.
  $rows.on('click', '.tag', function() {
    var category = $(this).data('category');
    var current = $search.val().trim();
    $search.val(current ? current + ', ' + category : category);
    filter();
  });
});
