$(document).ready(function(){
    var clip = new ZeroClipboard.Client();
    var domain = $("html").data("domain");
    //Set new short link
    $("#submitBtn").click(function(){
        var httpSearch = $("#originalURL").val().search(/^(ftp|http|https):\/\//);
        if (httpSearch == -1){
            var newVal = "http://"+$("#originalURL").val();
            $("#originalURL").val(newVal);
        }
        if (isURL($("#originalURL").val())){
            var encodedUrl = (escape($("#originalURL").val())).replace(/\+/g, "%20");
            $.ajax({
                    url: "/rpc/setLink",
                    type: "json",
                    method: "post",
                    data: "originalURL="+encodedUrl,
                    success: function(res){
                        $("#errorMessage").html(""); //Reset error message
                        if (res.shortenError === false){
                            $("#shortenedLink").html(res.shortenedURL);
                            $("#liveSelect").val(res.shortenedURL);
                            $("#shortenedLink").attr("href", res.shortenedURL);
                        }else{
                            $("#response").css({display: 'none'});
                            $("#errorMessage").html(res.shortenError);
                        }
                        $("#response").css({display: 'block'});
                    },
                    error: function(err) {
                        //TODO
                    }
                }
            );
        }else{
            $("#errorMessage").html("Invalid link.");
            $("#response").css({display: 'none'});
        }
    });

    //Get shortlink stats
    $("#getStatsSubmitBtn").click(function(){
        var shortenedURL = $("#shortenedURL").val();
        var regex = new RegExp("^http:\/\/" + domain + "\/[a-zA-Z0-9]{6,32}$");
        if (regex.test(shortenedURL)){
            $.ajax({
                url: "/rpc/getLink",
                type: "json",
                method: "post",
                data: "shortenedURL="+shortenedURL,
                success: function(res){
                    if (res.error === false){
                        $("#statsError").html("");
                        $(".addedIn").remove();
                        //Populate and display stats
                        var fullLink = "http://" + domain + "/" + res.linkHash;
                        $("#StatsTitle").attr("href", fullLink);
                        $("#StatsTitle").html(fullLink);

                        $("#StatsOriginalURL").val(res.originalURL);
                        $("#timesUsed").html(res.timesUsed);
                        $("#dateShortened").html(mysqlDateToJavascriptDate(res.dateShortened));
                        var appendMe = "";
                        if (res.topUserAgents.length > 0){
                            for (var i = 0; res.topUserAgents.length > i; i++){
                                var odd = "";
                                if (i % 2 == 0){
                                    odd = "odd";
                                }
                                appendMe += "<tr class=\"" + odd + " addedIn\"><td>" + res.topUserAgents[i].userAgent + "</td><td class=\"tableCount\">" + res.topUserAgents[i].agentCount + "</td></tr>";
                            }
                            $(".userAgents").append(appendMe);
                        }

                        if (res.topReferrals.length > 0){
                            appendMe = "";
                            for (var a = 0; res.topReferrals.length > a; a++){
                                var odd = "";
                                if (a % 2 == 0){
                                    odd = "odd";
                                }
                                if (res.topReferrals[a].referrer == ""){
                                    referrer = "&lt;none&gt;";
                                }else{
                                    referrer = res.topReferrals[a].referrer;
                                }
                                appendMe += "<tr class=\"" + odd + " addedIn\"><td>" + referrer + "</td><td class=\"tableCount\">" + res.topReferrals[a].referrerCount + "</td></tr>";
                            }
                            $(".referrers").append(appendMe);
                        }
                        //Show it!
                        $("#getLinkResponse").css({display: 'block'});
                    }else{
                        $("#statsError").html(res.error);
                        if (res.linkHash !== "" && res.originalURL !== ""){
                            var fullLink = "http://" + domain + "/" + res.linkHash;
                            $("#StatsTitle").attr("href", fullLink);
                            $("#StatsTitle").html(fullLink);
                            $("#StatsOriginalURL").val(res.originalURL);
                            $("#timesUsed").html("0");
                        }
                    }
                },
                error: function(err){
                    $("#statsError").html("Error, try again later");
                    console.log(err);
                }
            });
        }else{
            //Invalid url
            $("#statsError").html("Not a " + domain + " URL");
        }
    });

    $("#liveCopyToClip").listen("click", function(){
        clip.setText($("#liveSelect").val());
        clip.glue("liveCopyToClip");
        $("#liveCopyToClip").html("Once more");
        clip.addEventListener('complete', function() {
            
            $("#liveCopyToClip").html("Copied");
            setTimeout("$('#liveCopyToClip').html('Click To Copy');", 2000);
        });
    });

    $("#liveSelect").listen("click", function(){
        $("#liveSelect")[0].select();
    });
    $("#shortenedURL").listen("click", function(){
        $("#shortenedURL")[0].select();
    });
    $("#Modal").overlay({
            trigger: "#GetURLStats",
            position: "fixed",
            showMask: false,
            startAnimationCss: {
                opacity: 0,
                top: 0
            },
            animationIn: {
                opacity: 1,
                top: 80,
                duration: 400
            },
            animationOut: {
                opacity: 0,
                top: -200,
                duration: 400
            },
            onOpen: function(){
                $("#statsError").html("");
            }
    });
});

function isURL(testURL) {
    var domain = $("html").data("domain");
    var alreadyShortTest = new RegExp("^http:\/\/" + domain + "\/[a-zA-Z0-9]+$");
    if (alreadyShortTest.test(testURL) === false){
        var mainURLTest = /^(https?):\/\/((?:[a-z0-9.-]|%[0-9A-F]{2}){3,})(?::(\d+))?((?:\/(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})*)*)(?:\?((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?(?:#((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?$/i;
        return mainURLTest.test(testURL);   
    }else{
        return false;
    }
}

function mysqlDateToJavascriptDate(mytimestamp) {
    var regex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2}).000Z$/;
    var parts = mytimestamp.replace(regex, "$1 $2 $3 $4 $5 $6").split(' ');
    var properDate = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
    return properDate;
}

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-6347925-2']);
_gaq.push(['_trackPageview']);
(function() {
var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();