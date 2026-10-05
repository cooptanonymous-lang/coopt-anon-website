// Builds the floating table of contents from the page's section (h2) and
// subsection (h4) headings, and highlights the entry for the section in view.

$(document).ready(function() {
  var $list = $('#toc-list');
  if ($list.length === 0) {
    return;
  }

  // Headings inside widgets (e.g. the survey page title) are not sections.
  var $headings = $('.section h2.title[id], .section h4.title[id]')
    .not('.survey-viewer *');
  if ($headings.length === 0) {
    return;
  }

  var $links = $();
  $headings.each(function() {
    var level = this.tagName === 'H2' ? 'toc-section' : 'toc-subsection';
    var $link = $('<a>')
      .attr('href', '#' + this.id)
      .text($(this).text());
    $('<li>').addClass(level).append($link).appendTo($list);
    $links = $links.add($link);
  });

  // The active heading is the last one scrolled past the top quarter of the
  // viewport; at the bottom of the page, the last heading wins.
  function updateActive() {
    var threshold = window.innerHeight / 4;
    var active = 0;
    $headings.each(function(i) {
      if (this.getBoundingClientRect().top <= threshold) {
        active = i;
      }
    });
    var atBottom = window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;
    if (atBottom) {
      active = $headings.length - 1;
    }
    $links.removeClass('is-active').eq(active).addClass('is-active');
  }

  var pending = false;
  $(window).on('scroll resize', function() {
    if (pending) {
      return;
    }
    pending = true;
    window.requestAnimationFrame(function() {
      pending = false;
      updateActive();
    });
  });
  updateActive();
});
