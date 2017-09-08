var endpoint = "wss://p14gsqyb.api.satori.com";
var appkey = "deAb82463fD82665f0F79ecBAeBAC1C1";
var channelName = "3dremote";

var lastAlpha = 0,
    alphaoffset = 0,
    isOriented = 0;

if (!window.DeviceOrientationEvent){
    alert("Your device does not support device orientation.");
}else{
    //Set up the Satori RTM client and detect connection state
    var client = new RTM(endpoint, appkey);
    //$(".oriented, .connected").hide();
    client.on("enter-connected", function () {
        $(".connected").show();
        $(".connecting").hide();
    });
    client.on("leave-connected", function () {
        $(".connected").hide();
        $(".connecting").show();
    });
    client.start();

    //Send data to Satori - this is where the magic happens
    function publishData(data){
        if (client.isConnected()) {
            client.publish(channelName, data, function(pdu) {
                if (!pdu.action.endsWith("/ok")) console.log("Publish request failed", pdu.body);
            }); 
        }
    }

    //Listen for device orientation changes
    window.addEventListener("deviceorientation", handleOrientation, true);
    function handleOrientation(event){
        lastAlpha = event.alpha;
        var debugInfo = Math.floor(event.alpha) + ", " + Math.floor(event.beta) + ", " + Math.floor(event.gamma);
        $("#debug").html(debugInfo);
        if (isOriented) publishData({alpha: event.alpha + alphaOffset, beta: event.beta, gamma: event.gamma});
    }

    //Let user orient their device to the remote screen
    $("#orient").on("click", function(){
        alphaOffset = -lastAlpha;
        $(".not-oriented").hide();
        $(".oriented").fadeIn();
        $("body").addClass("is-oriented");
        isOriented = true;
    });

    //Handle pinch-zoom
    interact('#body').gesturable({
        onmove: function (event) {
            var data = {zoom: event.ds}
            publishData(data);
        }
    });

    //Allow user to choose a different 3D model
    $("#models button").click(function(){
        var model = $(this).data("model");
        if (model) publishData({"model": model});
    })
    
}

