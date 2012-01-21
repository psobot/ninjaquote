NEW_TIMER = 100;
REVEAL_TIMER = 1000;

total_counter = 0;
right_counter = 0;

window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};

fbimg = function(id) {
  return "<img src='http://graph.facebook.com/" + id + "/picture?type=large' />";
}

header = function(bool) {
  return bool ? "Yup!" : "Nope!";
}

updateCounters = function(){
  $('#score').slideDown();
  $('#score .right').html(right_counter);
  $('#score .total').html(total_counter);
  $('#score .percent').html(Math.round((right_counter/total_counter)*100));
}

reinit = function() {
  $('.yes').removeClass('yes');
  $('.no').removeClass('no');
  $('.clicked').removeClass('clicked');
  $('.person .back h3').show();
  $('.person .back p').show();
  $('.person .back p.wrong').hide();
}

//#next_spinner_container
getQuestion = function() {
  $('#header').slideUp();
  $('#question').fadeOut();
  $("#loading").slideDown();
  fetchQuestion();
}

getNewQuestion = function() {
  $("#next_spinner_container").slideDown();
  fetchQuestion();
}

fetchQuestion = function() {
  $.getJSON('get_entry', {token : FB.getAccessToken() }, function(data) {
    window.log(data);

    people = $('#people_wrapper a.person');
    person1div = $(people[0]);
    person2div = $(people[1]);

    $('#loading, #next_spinner_container').slideUp();
    $("#question").fadeOut(function(){
      reinit();

      $(person1div).data('uid', data.friend1.uid);
      $(person2div).data('uid', data.friend2.uid);

      $(".front h3", person1div).html(data.friend1.first_name);
      $(".front h3", person2div).html(data.friend2.first_name);

      $(".front .image_128", person1div).html(fbimg(data.friend1.uid));
      $(".front .image_128", person2div).html(fbimg(data.friend2.uid));

      $(person1div).addClass(data.quote.uid == data.friend1.uid ? 'yes' : 'no');
      $(person2div).addClass(data.quote.uid == data.friend2.uid ? 'yes' : 'no');

      $(".back h3", person1div).html(header(data.quote.uid == data.friend1.uid));
      $(".back h3", person2div).html(header(data.quote.uid == data.friend2.uid));

      $(".back p.first", person1div).html(function(){
        if (data.quote.uid == data.friend1.uid) return data.friend1.first_name + " said that!";
        else return data.friend1.first_name + " didn't say that.";
      });
      $(".back p.first", person2div).html(function(){
        if (data.quote.uid == data.friend2.uid) return data.friend2.first_name + " said that!";
        else return data.friend2.first_name + " didn't say that.";
      });

      $(".back p.wrong", person1div).html(function(){
        return "It was " + data.friend1.first_name + "!";
      });
      $(".back p.wrong", person2div).html(function(){
        return "It was " + data.friend2.first_name + "!";
      });

      $('#quote p').html(data.quote.message);
      $('#question').fadeIn('slow');    
      $('#whosaid').fadeIn('slow');    
    });
  });
}

window.fbAsyncInit = function() {
  FB.init({
      appId : '330392253659950',
      status : true, 
      cookie : true,
      xfbml : true,
      oauth : true,
  });

  FB.getLoginStatus(function(response){
    if(response.status === 'connected'){
      $('.fb-login-button').hide();
      $('.start').css('display', 'block');
      $(".start").click(function(e){
        $('.start').slideUp();
        e.preventDefault();
        getQuestion();
      });
    } else $('.fb-login-button').fadeIn();
  });

  FB.Event.subscribe('auth.login', function(response) {
    window.log(response);
    if (response.authResponse) {
      $('.fb-login-button').fadeOut();
      getQuestion();
    } else {
      window.log('User cancelled login or did not fully authorize.');
    }
  });

  $(".person").click(function(e){
    e.preventDefault();
    if (!$(this).hasClass('clicked')){
      total_counter++;
      if ($(this).hasClass('yes')) right_counter++;
      updateCounters();
    }
    $.getJSON('response', {
      token:    FB.getAccessToken(),
      my_uid:    FB.getUserID(),
      post_uid:   $(this).data('uid'),
      correct:  $(this).hasClass('yes')
    });
    $(this).addClass('clicked');
    if ($(this).hasClass('no')) {
      setTimeout(function() {
        if (!$('.person.yes.clicked').length) {
          $('.person.yes .back h3').hide();
          $('.person.yes .back p').hide();
          $('.person.yes .back p.wrong').show();
          $('.person.yes').addClass('clicked');
          setTimeout(function() {
            getNewQuestion();
          }, NEW_TIMER);
        }
      }, REVEAL_TIMER);
    } else {
      setTimeout(function() {
        getNewQuestion();
      }, NEW_TIMER);
    }
  });
  if (!$.browser.webkit) $('body').addClass('noflip');
};
(function(d){
    var js, id = 'facebook-jssdk';
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement('script');
    js.id = id;
    js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    d.getElementsByTagName('head')[0].appendChild(js);
}(document));
