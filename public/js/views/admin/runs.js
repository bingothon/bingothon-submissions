// data = {{submission_data}}
// eventData = {{eventData}}
// _csrf = {{csrfToken}}

$(function () {
  let filterMode = Number(localStorage.getItem('filter-mode')) || 0;
  let sortType = localStorage.getItem('sort-type') || 'date';
  let sortMode = localStorage.getItem('sort-mode') || 'asc';

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

  function postTo(url, data, successCallback) {
    data = data || {};
    data._csrf = _csrf;

    $.ajax({
      type: 'POST',
      url: url,
      data: JSON.stringify(data),
      success: successCallback,
      contentType: 'application/json',
      dataType: 'text'
    });
  }

  let submissions = Object.values(data.submissions);
  function fillSubmissions () {
    $('.submissions').empty();

    for (let i = 0; i < submissions.length; i++) {
      let _s = submissions[i];
      let uuid = _s.uuid;
      let _u = data.userInfo[_s.userID];

      let html = _s.isRace ? $('#submission-race-template').html() : $('#submission-template').html();
      html = html.replace(/##uuid##/g, uuid);
      if (_u.displayName.toLowerCase() === _u.speedrunComUser.toLowerCase()) html = html.replace(/##runner-name##/g, _u.displayName);
      else html = html.replace(/##runner-name##/g, `${_u.displayName} (${_u.speedrunComUser})`);
      html = html.replace(/##twitch##/g, _u.username);
      html = html.replace(/##display-name##/g, _u.displayName);
      html = html.replace(/##avatar##/g, _u.avatar);
      html = html.replace(/##speedrun-com-user##/g, _u.speedrunComUser);

      let cons = {
        discord: false,
        twitter: false,
        youtube: false
      };

      if (_u.connections.discord.username) {
        let discord = _u.connections.discord;
        html = html.replace(/##discord##/g, (discord.username + '#' + discord.discriminator));
        cons.discord = true;
      }
      if (_u.connections.twitter.username) {
        let twitter = _u.connections.twitter;
        html = html.replace(/##twitter##/g, (twitter.username));
        cons.twitter = true;
      }
      if (_u.connections.youtube.id) {
        let youtube = _u.connections.youtube;
        html = html.replace(/##youtube-id##/g, (youtube.id));
        html = html.replace(/##youtube##/g, (youtube.displayName));
        cons.youtube = true;
      }
      html = html.replace(/##game##/g, _s.game.name);
      html = html.replace(/##platform##/g, _s.game.platform);
      html = html.replace(/##region##/g, _s.game.region);
      html = html.replace(/##category##/g, _s.game.category);
      html = html.replace(/##estimate##/g, _s.game.estimate);
      html = html.replace(/##video##/g, _s.game.video);

      if (_s.isRace) {
        _s.allRunnersAgreed = true;

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
            _s.allRunnersAgreed = false;
          } else { // Undecided or corrupted?
            label = label.replace('##color##', 'blue');
            label = label.replace('##tooltip##', 'Undecided');
            _s.allRunnersAgreed = false;
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
        $submission.find('.edit-reason-button').hide();
        $submission.find('.add-reason-button').show();
        $submission.find('.admin-comments p').text('');
      } else {
        $submission.find('.admin-comments').show();
        $submission.find('.edit-reason-button').show();
        $submission.find('.admin-comments p').text(_s.reason);
      }

      if (cons.discord) {
        $submission.find('.discord.to-show').removeClass('to-show');
      }
      if (cons.twitter) {
        $submission.find('.twitter.to-show').removeClass('to-show');
      }
      if (cons.youtube) {
        $submission.find('.youtube.to-show').removeClass('to-show');
      }

      if (_s.state == 0) { // Pending
        $submission.find('.pending-run').addClass('disabled');
      } else if (_s.state == 1) { // Accepted
        $submission.find('.accept-run').addClass('disabled');
      } else if (_s.state == 2) { // Rejected
        $submission.find('.reject-run').addClass('disabled');
      }

      $submission.find('.visibility-toggle').checkbox(`set ${_s.visible ? '' : 'un'}checked`);

      if (_s.isRace && !_s.allRunnersAgreed) {
        $submission.find('.accept-run').addClass('disabled');
        $submission.find('.ui.buttons').first().after('<div class="ui pointing red basic label">Not all runners have accepted!</div>');
      }
	}
  }
//   fillSubmissions();
  sortRuns();
  filterRuns();

  $('.ui.accordion').accordion();

  $(document).on('click', '.runner-info .discord', function () {
    window.alert($(this).attr('discord-id'));
  });

  $(document).on('click', '.pending-run', function () {
    let uuid = $(this).parents('.submission').attr('uuid');
    let submission = data.submissions[uuid];
    let userInfo = data.userInfo[submission.userID];

    let $modal = $('.pending-run-modal');
    $modal.find('code.runner').text(userInfo.displayName + ' (' + userInfo.username + ')');
    $modal.find('code.game').text(submission.game.name);
    $modal.find('code.platform').text(submission.game.platform);
    $modal.find('code.region').text(submission.game.region);
    $modal.find('code.category').text(submission.game.category);
    $modal.find('code.estimate').text(submission.game.estimate);

    $modal.modal({
      closable: false,
      onApprove: () => {
        $(this).addClass('disabled');

        postTo('/api/admin/submissions/' + uuid + '/decide', { state: 0, reason: $modal.find('textarea.comments').val() }, () => location.reload());
      }
    }).modal('show');
  });

  $(document).on('click', '.accept-run', function () {
    let uuid = $(this).parents('.submission').attr('uuid');
    let submission = data.submissions[uuid];
    let userInfo = data.userInfo[submission.userID];

    let $modal = $('.accept-run-modal');
    $modal.find('code.runner').text(userInfo.displayName + ' (' + userInfo.username + ')');
    $modal.find('code.game').text(submission.game.name);
    $modal.find('code.platform').text(submission.game.platform);
    $modal.find('code.region').text(submission.game.region);
    $modal.find('code.category').text(submission.game.category);
    $modal.find('code.estimate').text(submission.game.estimate);

    $modal.find('.race-warning').hide();
    for (let id in submission.runners) {
      if (submission.runners[id] === 0) {
        $modal.find('.race-warning').show();
        break;
      }
    }

    $modal.modal({
      closable: false,
      onApprove: () => {
        $(this).addClass('disabled');

        postTo('/api/admin/submissions/' + uuid + '/decide', { state: 1, reason: $modal.find('textarea.comments').val() }, () => location.reload());
      }
    }).modal('show');
  });

  $(document).on('click', '.reject-run', function () {
    let uuid = $(this).parents('.submission').attr('uuid');
    let submission = data.submissions[uuid];
    let userInfo = data.userInfo[submission.userID];

    let $modal = $('.reject-run-modal');
    $modal.find('code.runner').text(userInfo.displayName + ' (' + userInfo.username + ')');
    $modal.find('code.game').text(submission.game.name);
    $modal.find('code.platform').text(submission.game.platform);
    $modal.find('code.region').text(submission.game.region);
    $modal.find('code.category').text(submission.game.category);
    $modal.find('code.estimate').text(submission.game.estimate);

    $modal.modal({
      closable: false,
      onApprove: () => {
        $(this).addClass('disabled');

        postTo('/api/admin/submissions/' + uuid + '/decide', { state: 2, reason: $modal.find('textarea.comments').val() }, () => location.reload());
      }
    }).modal('show');
  });

  $(document).on('click', '.delete-run', function () {
    let uuid = $(this).parents('.submission').attr('uuid');

    let submission = data.submissions[uuid];
    let user = data.userInfo[submission.userID];

    $('.delete-run-modal .content .game').text(submission.game.name);
    $('.delete-run-modal .content .username').text(user.displayName + ' (' + user.username + ')');

    $('.delete-run-modal').modal({
      onApprove: () => {
        delete submission[uuid];
        $('.submission[uuid="' + uuid + '"]').addClass('animated slideOutLeft').one('animationend', function () {
          $(this).removeClass('animated slideOutLeft');
          $(this).remove();

          postTo('/api/admin/submissions/' + uuid + '/remove');
        });
      }
    })
      .modal('show');
  });

  $(document).on('click', '.reason-button', function () {
    let uuid = $(this).parents('.submission').attr('uuid');

    $('.edit-reason-modal').modal({
      closable: false,
      onApprove: () => {
        $(this).addClass('disabled');

        postTo('/api/admin/submissions/' + uuid + '/update-reason', { reason: $('.reason-textarea').val() }, () => location.reload());
      },
      onShow: () => {
        let oldComment = $(this).parents('.center.aligned.column').find('.admin-comments > p').text();
        $('.reason-textarea').val(oldComment);
      }
    }).modal('show');
  });

  $('.edit-run-modal textarea').on('input', function () {
    let text_length = $(this).val().length;

    $(this).parent().children('.chars-used').text(text_length + '/750');
  });

  function removeFormError() {
    $('.edit-run-modal .ui.form .required').removeClass('error');
    $('.edit-run-modal .ui.form').removeClass('error');
    $('.edit-run-modal .error-message').text('');
  }

  function formError(element, message) {
    $(element).parent().addClass('error');
    $('.edit-run-modal .ui.form').addClass('error');
    $('.edit-run-modal .error-message').text(message);
  }

  function clearBullshit() {
    availability = 0;
    $('.edit-run-modal .availability-list').children().remove();

    removeFormError();
  }

  $(document).on('click', '.edit-run', function () {
    clearBullshit();

    let uuid = $(this).parents('.submission').attr('uuid');
    let submission = data.submissions[uuid];

    let $form = $('.edit-run-modal .ui.form');

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

    $('.edit-run-modal').modal({
      closable: false,
      onApprove: () => {
        let valid = true;
        let firstInvalid;
        $('.edit-run-modal .required input').each(function () {
          if ($(this).val() === '') {
            valid = false;
            firstInvalid = firstInvalid || $(this).attr('invalidname');
            $(this).parent().addClass('error');
          } else {
            $(this).parent().removeClass('error');
          }
        });

        $('.edit-run-modal .ui.form').removeClass('error');
        if (!valid) {
          formError(null, 'Invalid ' + firstInvalid + '.');
          return false;
        }

        // Estimate format check
        let estimateRegex = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;
        let $estimateInput = $('.edit-run-modal input[name="estimate"]');
        if (!estimateRegex.test($estimateInput.val())) {
          formError($estimateInput, 'Invalid estimate.');
          return false;
        }

        // Video format check
        let videoRegex = /^https?:\/\/.*$/;
        let $videoInput = $('.edit-run-modal input[name="video"]');
        if (!videoRegex.test($videoInput.val())) {
          formError($videoInput, 'Invalid video.');
          return false;
        }

        let data = {
          game: {
            name: $('.edit-run-modal input[name="game"]').val(),
            platform: $('input[name="platform"]').val(),
            region: $('input[name="region"]').val(),
            category: $('.edit-run-modal input[name="category"]').val(),
            estimate: $('.edit-run-modal input[name="estimate"]').val(),
            video: $('.edit-run-modal input[name="video"]').val(),
            leaderboards: $('input[name="leaderboards"]').val(),
            twitch_name: $('input[name="twitch-name"]').val()
          },
          availability: $('.edit-run-modal .availability-textarea').val(),
          incentives: $('.edit-run-modal .incentives-textarea').val(),
          comments: $('.edit-run-modal .comments-textarea').val()
        };

        postTo('/api/admin/submissions/' + uuid + '/update', data, () => location.reload());
      }
    }).modal('show');
  });
  // Section for run editing ends here!!!

  function filterRuns () {
    if (filterMode === 0) return $('.submissions > .submission').show(400);

    $('.submissions > .submission').not(`.submission[state=${filterMode}]`).hide(400);
    $(`.submissions > .submission[state=${filterMode}]`).show(400);
  }
  $(document).on('click', '.filter-menu > a', function () {
    $('.filter-menu > a').removeClass('active');
    $(this).addClass('active');

	filterMode = Number($(this).attr('filter-type'));
	localStorage.setItem('filter-mode', filterMode);
    filterRuns();
  });

  function sortRuns () {
    switch (sortType) {
      case 'date': {
        submissions.sort((a, b) => {
          let dateA = new Date(a.timestamp);
          let dateB = new Date(b.timestamp);

          if (dateA === dateB) return 0;

          if (sortMode === 'asc') return dateA > dateB ? 1 : -1;
          else return dateA < dateB ? 1 : -1;
        });
        fillSubmissions();
        break;
      }
      case 'game': {
        submissions.sort((a, b) => {
          let gameNameA = a.game.name;
          let gameNameB = b.game.name;

          if (gameNameA === gameNameB) return 0;

          if (sortMode === 'asc') return gameNameA > gameNameB ? 1 : -1;
          else return gameNameA < gameNameB ? 1 : -1;
        });
        fillSubmissions();
        break;
      }
      case 'runner': {
        submissions.sort((a, b) => {
          let displayNameA = data.userInfo[a.userID].displayName.toLowerCase();
          let displayNameB = data.userInfo[b.userID].displayName.toLowerCase();

          let gameNameA = a.game.name;
          let gameNameB = b.game.name;

          if (displayNameA === displayNameB) return gameNameA > gameNameB ? 1 : -1;

          if (sortMode === 'asc') return displayNameA > displayNameB ? 1 : -1;
          else return displayNameA < displayNameB ? 1 : -1;
        });
        fillSubmissions();
        break;
      }
    }
  }

  $('.ui.dropdown').dropdown();
  $(document).on('click', '.sorting-menu > .item', function () {
    sortType = $(this).attr('sort-type');
    sortMode = $(this).attr('sort-mode');
	
	localStorage.setItem('sort-type', sortType);
	localStorage.setItem('sort-mode', sortMode);

    sortRuns();
    filterRuns();
  });

  $('.filter-menu > a').removeClass('active');
  $(`.filter-menu > a[filter-type=${filterMode}]`).addClass('active');
  $('.sorting-menu > div').removeClass('active');
  $(`.sorting-menu > div[sort-type=${sortType}][sort-mode=${sortMode}]`).addClass('active');

  $(document).on('change', '.visibility-toggle', function () {
    let uuid = $(this).parents('.submission').attr('uuid');

    let visible = $(this).checkbox('is checked');
    postTo('/api/admin/submissions/' + uuid + '/visibility', { uuid: uuid, state: visible });
  });
});
