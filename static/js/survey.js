// Toggles between the pages of the post-experiment survey.
// The survey content lives in index.html; each page is a .survey-page div.

$(document).ready(function() {
  var $viewer = $('#survey-viewer');
  if ($viewer.length === 0) {
    return;
  }

  var $pages = $viewer.find('.survey-page');
  if ($pages.length === 0) {
    return;
  }

  var current = 0;

  // The incoming page slides in from the side it "came from": moving forward
  // brings the next page in from the right, moving back from the left.
  function show(index) {
    var forward = index > current;
    var animate = index !== current;

    current = index;
    $('#survey-page-title').text('Page ' + (index + 1) + ' of ' + $pages.length);

    var $incoming = $pages.eq(index);
    $pages.not($incoming).addClass('is-hidden');
    $incoming.removeClass('is-hidden slide-from-right slide-from-left');

    if (animate) {
      // Reading offsetWidth restarts the animation when the class is re-added.
      $incoming[0].offsetWidth;
      $incoming.addClass(forward ? 'slide-from-right' : 'slide-from-left');
    }
    $('#survey-prev').prop('disabled', index === 0);
    $('#survey-next').prop('disabled', index === $pages.length - 1);
    $('#survey-pages .pagination-link').each(function(i) {
      $(this).toggleClass('is-current', i === index)
             .attr('aria-current', i === index ? 'page' : null);
    });
  }

  var $links = $('#survey-pages').empty();
  $pages.each(function(i) {
    var $link = $('<button/>')
      .addClass('pagination-link')
      .attr('aria-label', 'Go to page ' + (i + 1))
      .text(i + 1)
      .on('click', function() {
        show(i);
      });
    $links.append($('<li/>').append($link));
  });

  $('#survey-prev').on('click', function() {
    if (current > 0) {
      show(current - 1);
    }
  });

  $('#survey-next').on('click', function() {
    if (current < $pages.length - 1) {
      show(current + 1);
    }
  });

  show(0);
});
