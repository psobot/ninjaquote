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

fbimg = function(id, type) {
  if (typeof type === "undefined") type = "large";
  return "<img src='http://graph.facebook.com/" + id + "/picture?type="+type+"' />";
}

header = function(bool) {
  return bool ? "Yup!" : "Nope!";
}

updateCounters = function(){
  $('#score').slideDown();
  $('#score .right').html(right_counter);
  $('#score .total').html(total_counter);
  $('#score .percent').html(Math.round((right_counter/total_counter)*100));
  $('#score a').attr('href','/?#'+FB.getUserID());
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

fetchScores = function(user_uid, callback) {
  $.getJSON('scores', {my_uid: user_uid}, function(data){
    window.log(data);
    callback(data);
  });
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

loadFB = function() {
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

}

window.fbAsyncInit = function() {
  if (window.location.hash == "") loadFB();
  else {
    user_uid = parseInt(window.location.hash.substr(1));
    fetchScores(user_uid, function(response){
      if (!Object.keys(response).length) loadFB();
      else {
        //  HACK HACK HACK
        //  THIS IS OUR SCORES PAGE
        //  Let's grab the person's open graph stuff
        $("#header").hide();
        $.getJSON("http://graph.facebook.com/"+user_uid, function(userdata){
          $("#stats .top h2").html(
            'How well does '+userdata.first_name+" know "+(userdata.gender=='female'?'her':'his')+" friends?"
          );
          $("#stats .top img").attr('src', "http://graph.facebook.com/"+user_uid+"/picture?type=large");
          

          var people = {};
          var sorted_people = [];
          for (var key in response){
            var person_id = key.split('-')[0];
            if (!(person_id in people)) people[person_id] = {'t': 0, 'f': 0};
            people[person_id][key.split('-')[1]] = parseInt(response[key]);
            sorted_people.push(person_id);
          }
          
          sorted_people = sorted_people.sort(function(a, b){
            var a_total = people[a].t + people[a].f;
            var a_percent_right = (people[a].t/a_total)*100;
            var b_total = people[b].t + people[b].f;
            var b_percent_right = (people[b].t/b_total)*100;
            return b_percent_right - a_percent_right;
          });
          
          ul = $('#stats ul')  
          for (var i = 0; i < sorted_people.length; i++){
            person_id = sorted_people[i];
            var total = people[person_id].t + people[person_id].f;
            var percent_right = (people[person_id].t/total)*100;
            ul.append(
              '<li><a href="http://facebook.com/'+person_id+'">'+
              fbimg(person_id, 'square')+"</a>"+
              '<div class="bar">'+
              '<div class="score_text">'+
                people[person_id].t+'/'+total+" ("+Math.round(percent_right)+"%)</div>"+
                '<div class="right" style="width:'+percent_right+'%">'+
                '</div>'+
              '</div></li>');
          }

          $("#stats").show();
        });
      }
    });
  }
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
