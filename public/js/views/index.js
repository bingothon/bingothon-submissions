// eventData = {{eventData}}

$(function () {
  let event_from_local = moment.tz(eventData.event_from, eventData.timezone);
  let event_from_user = moment(eventData.event_from);
  let event_to_local = moment.tz(eventData.event_to, eventData.timezone);
  let event_to_user = moment(eventData.event_to);

  $('.cookie.nag').nag('show');
  $('.about-powers-link').on('click', () => {
    $('.cookie.nag').nag('dismiss');
  });
  $('.marathon-name').text(eventData.name);
  $('.timezone').text(eventData.timezone + event_from_local.format(' (z / UTC Z)'));
  $('.event-from').text(event_from_local.format('LLLL') + ' (Local / ' + event_from_local.format('UTC Z') + ')');
  $('.event-from').attr('data-tooltip', event_from_user.format('LLLL') + ' (Your timezone / ' + event_from_user.format('UTC Z') + ')');
  $('.event-to').text(event_to_local.format('LLLL') + ' (Local / ' + event_to_local.format('UTC Z') + ')');
  $('.event-to').attr('data-tooltip', event_to_user.format('LLLL') + ' (Your timezone / ' + event_from_user.format('UTC Z') + ')');
  $('.submission-limit').text(eventData.submissionLimit);

  let converter = new showdown.Converter({
    openLinksInNewWindow: true
  });
  $('.markdown-content').html(converter.makeHtml(eventData.info));
});
