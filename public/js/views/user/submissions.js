// data = {{submission_data}}
// eventData = {{eventData}}
// _csrf = {{csrfToken}}

$(function () {
  let selectedGame;
  $('.game-search').search({
    error: {
      noResults: 'No game with that name found. You can still submit it though!'
    },
    apiSettings: {
      url: '//www.speedrun.com/api/v1/games?embed=platforms,regions&name={query}&callback=?',
      onResponse: function (srResponse) {
        let response = {
          results: []
        };

        for (let i = 0; i < srResponse.data.length; i++) {
          let item = srResponse.data[i];

          let res = {
            id: item.id,
            title: item.names.international,
            twitch_name: item.names.twitch,
            platforms: item.platforms,
            regions: item.regions,
            link: item.weblink
          };

          if (item.names.japanese) {
            res.description = 'Japanese: ' + item.names.japanese;
          }

          response.results.push(res);
        }
        return response;
      }
    },
    minCharacters: 3,
    onSelect: function (result) {
      selectedGame = result;
      $('input[name="leaderboards"]').val(selectedGame.link);
      $('input[name="twitch-name"]').val(selectedGame.twitch_name || '');
    }
  });

  for (let i = 0; i < data.submissions.length; i++) {
    let _s = data.submissions[i];
    var uuid = _s.uuid;

    let html = _s.isRace ? $('#submission-race-template').html() : $('#submission-template').html();
    html = html.replace(/##uuid##/g, uuid);
    html = html.replace(/##game##/g, _s.game.name);
    html = html.replace(/##platform##/g, _s.game.platform);
    html = html.replace(/##region##/g, _s.game.region);
    html = html.replace(/##category##/g, _s.game.category);
    html = html.replace(/##estimate##/g, _s.game.estimate);
    html = html.replace(/##video##/g, _s.game.video);

    if (_s.isRace) {
      let runnersArray = [];
      for (let i in _s.runners) {
        let state = _s.runners[i];
        let label = '<label class="ui label ##color##" data-tooltip="##tooltip##">##name##</label>';

        // Name replacement
        if (data.userInfo[i]) {
          label = label.replace('##name##', data.userInfo[i].displayName);
        } else {
          label = label.replace('##name##', i);
        }

        // Color replacement
        if (state === 1) { // Accepted
          label = label.replace('##color##', 'green');
          label = label.replace('##tooltip##', 'Accepted');
        } else if (state === 2) { // Declined
          label = label.replace('##color##', 'red');
          label = label.replace('##tooltip##', 'Declined');
        } else { // Undecided or corrupted?
          label = label.replace('##color##', 'blue');
          label = label.replace('##tooltip##', 'Undecided');
        }
        runnersArray.push(label);
      }
      let runners = runnersArray.join('');
      html = html.replace(/##runners##/g, runners);
    }

    html = html.replace(/##state##/g, _s.state + 1);
    if (_s.state == 0) {
      html = html.replace(/##status-class##/g, 'pending');
      html = html.replace(/##status-color##/g, 'blue');
      html = html.replace(/##status-text##/g, 'Pending');
    } else if (_s.state == 1) {
      html = html.replace(/##status-class##/g, 'accepted');
      html = html.replace(/##status-color##/g, 'green');
      html = html.replace(/##status-text##/g, 'Accepted');
    } else if (_s.state == 2) {
      html = html.replace(/##status-class##/g, 'rejected');
      html = html.replace(/##status-color##/g, 'red');
      html = html.replace(/##status-text##/g, 'Rejected');
    }

    $('.submissions').append(html);
    let $submission = $('.submission[uuid="' + uuid + '"]');

    if (_s.game.leaderboards) {
      $submission.find('.game-link').attr('href', _s.game.leaderboards);
      $submission.find('.game-no-link').hide();
    } else {
      $submission.find('.game-link').hide();
    }

    if (_s.state == 1 || _s.state == 2) {
      $submission.find('.edit-button, .remove-button').addClass('disabled');
    }

    $submission.find('.availability p').text(_s.availability);

    if (!_s.comments || _s.comments === '') {
      $submission.find('.comments p').text('No comments supplied.');
    } else {
      $submission.find('.comments').show();
      $submission.find('.comments p').text(_s.comments);
    }

    if (!_s.incentives || _s.incentives === '') {
      $submission.find('.incentives p').text('No incentives supplied.');
    } else {
      $submission.find('.incentives p').text(_s.incentives);
    }

    if (!_s.reason || _s.reason === '') {
      $submission.find('.admin-comments').hide();
      $submission.find('.admin-comments p').text('');
    } else {
      $submission.find('.admin-comments').show();
      $submission.find('.admin-comments p').text(_s.reason);
    }
  }

  $('textarea').on('input', function () {
    let text_length = $(this).val().length;

    $(this).parent().children('.chars-used').text(text_length + '/750');
  });

  function removeFormError() {
    $('.ui.form .required').removeClass('error');
    $('.ui.form').removeClass('error');
    $('.error-message').text('');
  }

  function formError(element, message) {
    $(element).parent().addClass('error');
    $('.ui.form').addClass('error');
    $('.error-message').text(message);
  }

  function clearBullshit() {
    availability = 0;
    $('.availability-list').children().remove();

    removeFormError();
  }

  $(document).on('click', '.edit-button', function () {
    clearBullshit();

    let uuid = $(this).parents('.submission').attr('uuid');

    let submission = data.submissions.find(elem => elem.uuid === uuid);
    if (!submission) {
      return false;
    }

    let $form = $('.ui.form');

    $form.find('input[name="game"]').val(submission.game.name);
    $form.find('input[name="platform"]').val(submission.game.platform);
    $form.find('input[name="region"]').val(submission.game.region);
    $form.find('input[name="category"]').val(submission.game.category);
    $form.find('input[name="estimate"]').val(submission.game.estimate);
    $form.find('input[name="video"]').val(submission.game.video);
    $form.find('input[name="leaderboards"]').val(submission.game.leaderboards);
    $form.find('input[name="twitch-name"]').val(submission.game.twitch_name);
    $form.find('.availability-textarea').val(submission.availability).trigger('input');
    $form.find('.incentives-textarea').val(submission.incentives).trigger('input');
    $form.find('.comments-textarea').val(submission.comments).trigger('input');

    $('.edit-submission-modal').modal({
      closable: false,
      onApprove: () => {
        let valid = true;
        let firstInvalid;
        $('.required input').each(function () {
          if ($(this).val() === '') {
            valid = false;
            firstInvalid = firstInvalid || $(this).attr('invalidname');
            $(this).parent().addClass('error');
          } else {
            $(this).parent().removeClass('error');
          }
        });

        $('.ui.form').removeClass('error');
        if (!valid) {
          formError(null, 'Invalid ' + firstInvalid + '.');
          return false;
        }

        // Estimate format check
        let estimateRegex = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;
        let $estimateInput = $('input[name="estimate"]');
        if (!estimateRegex.test($estimateInput.val())) {
          formError($estimateInput, 'Invalid estimate.');
          return false;
        }

        // Video format check
        let videoRegex = /^https?:\/\/.*$/;
        let $videoInput = $('input[name="video"]');
        if (!videoRegex.test($videoInput.val())) {
          formError($videoInput, 'Invalid video.');
          return false;
        }

        let data = {
          _csrf: _csrf,
          game: {
            name: $('input[name="game"]').val(),
            platform: $('input[name="platform"]').val(),
            region: $('input[name="region"]').val(),
            category: $('input[name="category"]').val(),
            estimate: $('input[name="estimate"]').val(),
            video: $('input[name="video"]').val(),
            leaderboards: $('input[name="leaderboards"]').val(),
            twitch_name: $('input[name="twitch-name"]').val()
          },
          availability: $('.availability-textarea').val(),
          incentives: $('.incentives-textarea').val(),
          comments: $('.comments-textarea').val()
        };

        // Do post!
        $.ajax({
          type: 'POST',
          url: '/api/user/submissions/' + submission.uuid + '/update',
          data: JSON.stringify(data),
          success: () => {
            location.reload();
          },
          contentType: 'application/json',
          dataType: 'text'
        });
      }
    }).modal('show');
  });

  $(document).on('click', '.remove-button', function () {
    let uuid = $(this).parents('.submission').attr('uuid');

    let submission = data.submissions.find(elem => elem.uuid === uuid);

    $('.remove-submission-modal .content .game').text(submission.game.name);
    $('.remove-submission-modal .content .category').text(submission.game.category);
    $('.remove-submission-modal .content .estimate').text(submission.game.estimate);

    $('.remove-submission-modal').modal({
      closable: false,
      onApprove: () => {
        $.ajax({
          type: 'POST',
          url: '/api/user/submissions/' + uuid + '/remove',
          data: JSON.stringify({
            _csrf: _csrf
          }),
          success: () => {
            location.reload();
          },
          contentType: 'application/json',
          dataType: 'text'
        });
      }
    }).modal('show');
  });

  $('.ui.accordion').accordion();
});
