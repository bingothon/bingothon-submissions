// data = {{submission_data}}
// eventData = {{eventData}}

$(function () {
  let filterMode = Number(localStorage.getItem('filter-mode')) || 0;
  let sortType = localStorage.getItem('sort-type') || 'date';
  let sortMode = localStorage.getItem('sort-mode') || 'asc';

  let submissions = Object.values(data.submissions);
  function fillSubmissions () {
    $('.submissions').empty();

    for (let i = 0; i < submissions.length; i++) {
      let _s = submissions[i];
      let uuid = _s.uuid;
      if (!_s.visible) continue;

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
      let $submission = $('.submission[uuid="' + _s.uuid + '"]');

      if (_s.game.leaderboards) {
        $submission.find('.game-link').attr('href', _s.game.leaderboards);
        $submission.find('.game-no-link').hide();
      } else {
        $submission.find('.game-link').hide();
      }

      $submission.find('.availability p').text(_s.availability);

      if (!_s.incentives || _s.incentives === '') {
        $submission.find('.incentives p').text('No incentives supplied.');
      } else {
        $submission.find('.incentives p').text(_s.incentives);
      }

      if (!_s.comments || _s.comments === '') {
        $submission.find('.comments p').text('No comments supplied.');
      } else {
        $submission.find('.comments p').text(_s.comments);
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
    }
  }
//   fillSubmissions();
  sortRuns();
  filterRuns();

  $('.ui.accordion').accordion();

  $(document).on('click', '.runner-info .discord', function () {
    window.alert($(this).attr('discord-id'));
  });

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
  $('.sorting-menu > a').removeClass('active');
  $(`.sorting-menu > a[sort-type=${sortType}][sort-mode=${sortMode}]`).addClass('active');
});
