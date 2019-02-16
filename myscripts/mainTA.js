//Constants for the SVG
var margin = {top: 0, right: 0, bottom: 5, left: 5};
// var width = document.body.clientWidth - margin.left - margin.right;
var width = 5000;
// var height = 780 - margin.top - margin.bottom;
var height = 2500;
var defaultNode = 100;
var typeArray = ["Extrasystemic", "Interstate", "Internal", "Internationalized internal"];
//---End Insert------

//Append a SVG to the body of the html page. Assign this SVG as an object to svg

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
var svg2 = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height-100);

var topTermMode = 0;
//******************* Forced-directed layout    

//Set up the force layout
var force = d3.layout.force()
    .charge(-12)
    //.linkStrength(5)
    .linkDistance(0)
    .gravity(0.01)
    //.friction(0.95)
    .alpha(0.05)
    .size([width, height]);

 var force2 = d3.layout.force()
    .charge(-180)
    .linkDistance(80)
    .gravity(0.15)
    .alpha(0.1)
    .size([width, height]);     

//---Insert-------
var node_drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragstart(d, i) {
        force.stop() // stops the force auto positioning before you start dragging
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy; 
    }

    function dragend(d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        force.resume();
    }

    function releasenode(d) {
        d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        //force.resume();
    }


var data, data2;
var firstDate = Date.parse("2005");
var numSecondADay = 24*60*60;
var numSecondAMonth = 30*numSecondADay;
var minYear = 1945;
var maxYear = 2018;
var numMonth = 12*(maxYear-minYear);

var sourceList = {};
var numSource = {};
var maxCount = {}; // contain the max frequency for 4 categories

var nodes;
var numNode, numNode2;

var link;
var links;
var linkArcs;
var termArray, termArray2, termArray3;
var relationship;

var termMaxMax, termMaxMax2;
var terms;
var NodeG; 
var xStep =550;
//var xScale = d3.time.scale().range([0, (width-xStep-100)/numMonth]);
var yScale;
var linkScale;
var searchTerm ="";

var nodeY_byName = {};

var isLensing = false;
var lensingMul = 5;
var lMonth = -lensingMul*2;
var coordinate = [0,0];
var XGAP_ = 3; // gap between months on xAxis

function xScale(m){
    if (isLensing){
        var numLens = 5;
        var maxM = Math.max(0, lMonth-numLens-1);
        var numMonthInLense = (lMonth+numLens-maxM+1);
        
        //compute the new xGap
        var total= numMonth+numMonthInLense*(lensingMul-1);
        var xGap = (XGAP_*numMonth)/total;
        
        if (m<lMonth-numLens)
            return m*xGap;
        else if (m>lMonth+numLens){
            return maxM*xGap+ numMonthInLense*xGap*lensingMul + (m-(lMonth+numLens+1))*xGap;
        }   
        else{
            return maxM*xGap+(m-maxM)*xGap*lensingMul;
        }  
    }
    else{
       return m*XGAP_; 
    }           
}


var area = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return xStep+xScale(d.monthId); })
        .y0(function(d) { return d.yNode-yScale(d.value); })
        .y1(function(d) {  return d.yNode +yScale(d.value); });
  
var optArray = [];   // FOR search box

var numberInputTerms =0;
var listMonth;


 var nodes2 = [];
 var links2 = [];
var nodes2List = {};
var links2List = {};

//d3.tsv("data/corpus_ner_geo.tsv", function(error, data_) {
// d3.tsv("data/huffington.tsv", function(error, data_) {
//d3.tsv("data/wikinews.tsv", function(error, data_) {
d3.json("data/conflict/conflictInt.json", function(error, data_) {
      if (error) throw error;
    data = data_;
    console.log("data_");
    console.log(JSON.parse(JSON.stringify(data_)));
    terms = new Object();
    termMaxMax = 1;
    data.forEach(function(d) {
        d.source = d["source"];
        // Process date
        var curDate = Date.parse(d["time"]);
        d.date = new Date(d["time"]);
        // var year = d.date.getFullYear();
        var year = d["time"];
        var m =  12*(year-minYear)
            // + d.date.getMonth()
        ;
        d.m = m;        // month
         
        if (year>=minYear && year<=maxYear){
            // Add source to sourceList
            if (!sourceList[d.source])
                sourceList[d.source]=1;
            else
                sourceList[d.source]++;    
        }

        if (d["Extrasystemic"] != ""){
            var list = d["Extrasystemic"].split("|");
            for (var i=0; i<list.length;i++){   // xet term
                var term = list[i];
                d[term] = 1;                // tach term
                if (!terms[term]){                          // if never meet this term
                    terms[term] = new Object();
                    terms[term].max = 0;                    // init max: max occurence at a month
                    terms[term].maxMonth = -100;   // initialized negative, the month that occur most
                    terms[term].category = "Extrasystemic";
                }    
                if (!terms[term][m])                        // if term never meet this month m
                    terms[term][m] = 1;             // m is the month encounter
                else{
                    terms[term][m] ++;                      // if meet this month more than 1
                    if (terms[term][m]>terms[term].max){
                        terms[term].max = terms[term][m];
                        terms[term].maxMonth = m;
                        if (terms[term].max>termMaxMax)     // termMaxMax: max of max, dai loai la max nhat
                            termMaxMax = terms[term].max;
                    }    
                }    
            }
        }

        if (d["Interstate"] != "" && d["Interstate"] != 1){
            var list = d["Interstate"].split("|");
            for (var i=0; i<list.length;i++){
                var term = list[i];
                d[term] = 1;
                if (!terms[term]){
                    terms[term] = new Object();
                    terms[term].max = 0;
                    terms[term].maxMonth = -100;   // initialized negative
                    terms[term].category = "Interstate";
                }    
                if (!terms[term][m])
                    terms[term][m] = 1;
                else{
                    terms[term][m] ++;
                    if (terms[term][m]>terms[term].max){
                        terms[term].max = terms[term][m];
                        terms[term].maxMonth = m;
                        if (terms[term].max>termMaxMax)
                            termMaxMax = terms[term].max;
                        
                    }    
                }    
            }
        }
        if (d["Internal"] != "" && d["Internal"] != 1){
            var list = d["Internal"].split("|");
            for (var i=0; i<list.length;i++){
                var term = list[i];
                d[term] = 1;
                if (!terms[term]){
                    terms[term] = new Object();
                    terms[term].max = 0;
                    terms[term].maxMonth = -100;   // initialized negative
                    terms[term].category = "Internal";
                }    
                if (!terms[term][m])
                    terms[term][m] = 1;
                else{
                    terms[term][m] ++;
                    if (terms[term][m]>terms[term].max){
                        terms[term].max = terms[term][m];
                        terms[term].maxMonth = m;
                        if (terms[term].max>termMaxMax)
                            termMaxMax = terms[term].max;
                    }    
                }    
            }
        }
        if (d["Internationalized internal"] != "" && d["Internationalized internal"] != 1){
            var list = d["Internationalized internal"].split("|");
            for (var i=0; i<list.length;i++){
                var term = list[i];
                d[term] = 1;
                if (!terms[term]){
                    terms[term] = new Object();
                    terms[term].max = 0;
                    terms[term].maxMonth = -100;   // initialized negative
                    terms[term].category = "Internationalized internal";
                }    
                if (!terms[term][m])
                    terms[term][m] = 1;
                else{
                    terms[term][m] ++;
                    if (terms[term][m]>terms[term].max){
                        terms[term].max = terms[term][m];
                        terms[term].maxMonth = m;
                        if (terms[term].max>termMaxMax)
                            termMaxMax = terms[term].max;
                        
                    }    
                }    
            }
        }
        
    });

    console.log("DONE reading the input file = "+data.length);
    console.log("data:");
    console.log(data);

    setupSliderScale(svg);
    
    readTermsAndRelationships();  
    
    drawColorLegend();
    drawTimeLegend();
    drawTimeBox(); // This box is for brushing
    drawLensingButton();

    computeNodes();
    computeLinks();


    force.linkStrength(function(l) {
        if (l.value)
            return (8+l.value*2);
        else 
            return 1;       
    });
    
    force.linkDistance(function(l) {
        if (searchTerm!=""){
            if (l.source.name == searchTerm || l.target.name == searchTerm){
                var order = isContainedInteger(listMonth,l.m)
                return (12*order);  
            }    
            else
                return 0;    
        }
        else{
            if (l.value)
                return 0;
            else 
                return 12;           
        }
    });

    //Creates the graph data structure out of the json data30
        force.nodes(nodes)
            .links(links)
            .start();

        force.on("tick", function () {
            update();
        });
        force.on("end", function () {
            detactTimeSeries();
        });


        /// The second force directed layout ***********
    for (var i=0;i<nodes.length;i++){
        var nod = nodes[i];
        if (!nodes2List[nod.name] && nodes2List[nod.name]!=0){
            var newNod = {};
            newNod.name = nod.name;
            newNod.id = nodes2.length;
            newNod.group = nod.group;
            newNod.max = nod.max;
            
            nodes2List[newNod.name] = newNod.id;
            nodes2.push(newNod);
        }
    }

    for (var i=0;i<links.length;i++){
        var l = links[i];
        var name1 = l.source.name;
        var name2 = l.target.name;
        var node1 = nodes2[nodes2List[name1]];
        var node2 = nodes2[nodes2List[name2]];
        if (!links2List[name1+"_"+name2] && links2List[name1+"_"+name2]!=0){
            var newl = {};
            newl.source = node1;
            newl.target = node2;
            links2List[name1+"_"+name2] =  links2.length; 
            links2.push(newl); 
        }
    }
    for (var i=0;i<links2.length;i++){
        var name1 = links2[i].source.name;
        var name2 = links2[i].target.name;
        var ccc=0;
        for (var m=0;m<numMonth;m++){
            if (relationship[name1+"__"+name2][m]){
                if (relationship[name1+"__"+name2][m]>valueSlider) //relationship[name1+"__"+name2][m]>ccc && 
                    ccc+=relationship[name1+"__"+name2][m];
            }
         }   
        links2[i].count = ccc;
    }     
    
    

    force2.nodes(nodes2)
        .links(links2)
        .start();    


    var link2 = svg2.selectAll(".link2")
      .data(links2)
    .enter().append("line")
      .attr("class", "link2")
      .style("stroke","#777")
      .style("stroke-width", function(d) { return 0.2+linkScale(d.count); });

    var node2 = svg2.selectAll(".nodeText2")
        .data(nodes2)
        .enter().append("text")
      .attr("class", ".nodeText2")  
            .text(function(d) { return d.name })           
            .attr("dy", ".35em")
            .style("fill", function(d) { return getColor(d.group, d.max) ;})
            .style("text-anchor","middle")
            .style("text-shadow", "1px 1px 0 rgba(55, 55, 55, 0.6")
            .style("font-weight", function(d) { return d.isSearchTerm ? "bold" : ""; })
            .attr("dy", ".21em")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px"); 

    force2.on("tick", function() {
        link2.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        
        node2.attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
    });    

    

    for (var i = 0; i < termArray.length/10; i++) {
        optArray.push(termArray[i].term);
    }
    optArray = optArray.sort();
    $(function () {
        $("#search").autocomplete({
            source: optArray
        });
    });
});

    function recompute() {
        var bar = document.getElementById('progBar'),
            fallback = document.getElementById('downloadProgress'),
            loaded = 0;

        var load = function() {
            loaded += 1;
            bar.value = loaded;

            /* The below will be visible if the progress tag is not supported */
            $(fallback).empty().append("HTML5 progress tag not supported: ");
            $('#progUpdate').empty().append(loaded + "% loaded");

            if (loaded == 100) {
                clearInterval(beginLoad);
                $('#progUpdate').empty().append("Complete");
            }
        };

        var beginLoad = setInterval(function() {load();}, 10);
        setTimeout(alertFunc, 333);
        
        function alertFunc() {
            readTermsAndRelationships();
            computeNodes();
            computeLinks()
            force.nodes(nodes)
                .links(links)
                .start();
        }
    } 

    function readTermsAndRelationships() {
        data2 = data.filter(function (d, i) {
            if (!searchTerm || searchTerm=="" ) {       // data2 is data after check searchTerm
                return d;
            }
            else if (d[searchTerm])
                return d;
        });

        var selected  ={};
        if (searchTerm && searchTerm!=""){              // if searchTerm exist
            data2.forEach(function(d) {     // d: post
                 for (var term1 in d) {
                    if (!selected[term1])
                        selected[term1] = {};
                    else{
                        if (!selected[term1].isSelected)
                            selected[term1].isSelected = 1;
                        else
                            selected[term1].isSelected ++;
                    }    
               }
            } );
        }

        var removeList = {};   // remove list **************
       // removeList["russia"] =1;
       // removeList["china"] =1;
        
        removeList["barack obama"] =1;
        removeList["john mccain"] =1;
        removeList["mitt romney"] =1;
      //  removeList["hillary clinton"] =1; 
      //  removeList["paul ryan"] =1;
        removeList["sarah palin"] =1;
        removeList["israel"] =1;
        
        
        removeList["source"] =1;
        removeList["Extrasystemic"] =1;
        removeList["Interstate"] =1;
        removeList["Internal"] =1;
        removeList["Internationalized internal"] =1;

        removeList["muckreads weekly deadly force"] = 1
        removeList["propublica"] =1;
        removeList["white this alabama judge has figured out how"] =1;
        removeList["dea ’s facebook imExtrasystemicato"] =1;
        removeList["dismantle roe"] =1;
        removeList["huffington post"] =1;
        
        
        termArray = [];
        for (var att in terms) {        // xet each term
            var e =  {};
            e.term = att;
            if (removeList[e.term] || (searchTerm && searchTerm!="" && !selected[e.term])) // remove list **************
                continue;

            var maxNet = 0;
            var maxMonth = -1;
            for (var m=1; m<numMonth;m++){      // loop thru month, start with 2nd month
                if (terms[att][m]){
                    var previous = 0;
                    if (terms[att][m-1])
                        previous = terms[att][m-1];
                    var net = (terms[att][m]+1)/(previous+1);   // SUDDEN CHANGE!!!
                    if (net>maxNet){                     // get biggest sudden change throughout lifetime
                        maxNet=net;
                        maxMonth = m;
                    }    
                }
            }
            e.max = maxNet;
            e.maxMonth = maxMonth;
            e.category = terms[att].category;   
            
            if (e.term==searchTerm){        // exist search
                e.max = 10000;
                e.isSearchTerm = 1;
            }
              
            else if (searchTerm && searchTerm!="" && selected[e.term] && selected[e.term].isSelected){
                e.max = 5000+ selected[e.term].isSelected;
             //   console.log("e.term = "+e.term+" e.max =" +e.max );          
            }    

            if (!e.max && e.max!=0)
                console.log("What the e.term = "+e.term+" e.max =" +e.max );       

            termArray.push(e);
        }
        
        termArray.sort(function (a, b) {
          if (a.max < b.max) {
            return 1;
          }
          if (a.max > b.max) {
            return -1;
          }
          return 0;
        });    

        //if (searchTerm)
        numberInputTerms = termArray.length;
       console.log("numberInputTerms="+numberInputTerms) ;
       console.log("termArray:");
       console.log(JSON.parse(JSON.stringify(termArray)));
 
    // Compute relationship **********************************************************
        numNode = Math.min(defaultNode, termArray.length);
        numNode2 = Math.min(numNode*3, termArray.length);
        var selectedTerms = {};
        for (var i=0; i<numNode2;i++){
           selectedTerms[termArray[i].term] = termArray[i].max;
        }
        console.log("selected term");
        console.log(selectedTerms);         // top 300 cmnr

        relationship ={};
        var relationshipMaxMax =1;
        data2.forEach(function(d) {         // 16
            let specificCategory;
            typeArray.forEach((type,i) => {
                if ((d[type] !== "") && (d[type].length > 1)){
                    specificCategory = type;
                }
            });

            var year = d.date.getFullYear();
            if (year>=minYear && year<=maxYear){
                var m = d.m;
                for (var term1 in d) {
                    if (selectedTerms[term1]){   // if the term is in the selected 100 terms
                        for (var term2 in d) {
                            if ((selectedTerms[term2]) && (term2 !== term1)){   // if the term is in the selected 100
                                // terms
                                if (!relationship[term1+"__"+term2]){
                                    relationship[term1+"__"+term2] = new Object();
                                    relationship[term1+"__"+term2].max = 1;             // max: # occurence  per month
                                    relationship[term1+"__"+term2].maxMonth =m;
                                }    
                                if (!relationship[term1+"__"+term2][m]){
                                    relationship[term1+"__"+term2][m] = 1;
                                    relationship[term1+"__"+term2]["intensity_" + m] = d.intensity;
                                    relationship[term1+"__"+term2]["type_" + m] = specificCategory;
                                    }
                                else{
                                    relationship[term1+"__"+term2][m]++;    // add 1 more if occur twice
                                    if (relationship[term1+"__"+term2][m]>relationship[term1+"__"+term2].max){
                                        relationship[term1+"__"+term2].max = relationship[term1+"__"+term2][m];
                                        relationship[term1+"__"+term2].maxMonth =m; 
                                        
                                        if (relationship[term1+"__"+term2].max>relationshipMaxMax) // max over time
                                            relationshipMaxMax = relationship[term1+"__"+term2].max;
                                    }  
                                }    
                            }
                        }
                    }
                }
            }
        });

        console.log("relationship");
        console.log(relationship);
        console.log("DONE computing realtionships relationshipMaxMax="+relationshipMaxMax);

    }

    function computeConnectivity(a, num) {
        // choose to display, compare to valueSlider
        for (var i=0; i<num;i++){
            a[i].isConnected=-100;
            a[i].isConnectedMaxMonth= a[i].maxMonth;
        }    
        
        for (var i=0; i<num;i++){
            var term1 =  a[i].term;
            for (var j=i+1; j<num;j++){
                var term2 =  a[j].term;
                //
                if (relationship[term1+"__"+term2] && relationship[term1+"__"+term2].max>=valueSlider){
                    if (relationship[term1+"__"+term2].max> a[i].isConnected){
                        a[i].isConnected = relationship[term1+"__"+term2].max;
                        a[i].isConnectedMaxMonth = relationship[term1+"__"+term2].maxMonth;
                    }    
                    if (relationship[term1+"__"+term2].max> a[j].isConnected){
                        a[j].isConnected = relationship[term1+"__"+term2].max;
                        a[j].isConnectedMaxMonth = relationship[term1+"__"+term2].maxMonth;
                    }  
                }
                else if (relationship[term2+"__"+term1] && relationship[term2+"__"+term1].max>=valueSlider){
                    if (relationship[term2+"__"+term1].max>a[i].isConnected){
                        a[i].isConnected = relationship[term2+"__"+term1].max;
                        a[i].isConnectedMaxMonth = relationship[term1+"__"+term2].maxMonth;
                    }
                    if (relationship[term2+"__"+term1].max>a[j].isConnected){
                        a[j].isConnected = relationship[term2+"__"+term1].max;
                        a[j].isConnectedMaxMonth = relationship[term1+"__"+term2].maxMonth;
                    }    
                }
                 //if (term2=="beijing")
                 //   console.log(term2+" "+a[j].isConnectedMaxMonth);
            }
           
        }
       
    }


    function computeNodes() {
       
        // check substrings of 100 first terms
        console.log("termArray.length = "+termArray.length);        // 17 - net
        // excluse substring

        // for (var i=0; i<numNode2;i++){
        //   for (var j=0; j<numNode2;j++){
        //         if (i==j) continue;
        //         if (termArray[j].term.indexOf(termArray[i].term)>-1)
        //             termArray[i].isSubtring = 1;
        //     }
        // }
        //
        // termArray2 = [];
        // for (var i=0; i<numNode2;i++){
        //     if (termArray.length<numberInputTerms/3 || !termArray[i].isSubtring)  // only remove substring when there are too many of them
        //         termArray2.push(termArray[i])
        // }
        // console.log("termArray2.length = "+termArray2.length);
        // console.log(termArray2);

        termArray2 = JSON.parse(JSON.stringify(termArray.slice(0,numNode2)));

        termArray3 = [];
        var firstRound = 100, index = 0, plus = 5, currentRound;
        while (termArray3.length < termArray2.length) {
            termArray3 = [];
            currentRound = firstRound + index*plus;
            computeConnectivity(termArray2, currentRound);

            for (var i = 0; i < currentRound; i++) {
                if (termArray2[i].isSearchTerm || termArray2[i].isConnected > 0)
                    termArray3.push(termArray2[i]);
            }
            console.log("termArray3.length = " + termArray3.length);

            if (termArray3.length >= defaultNode) {
                break;
            }
            else {
                index += 1;
            }
        }

        termArray3.sort(function (a, b) {
         if (a.isConnected < b.isConnected) {
            return 1;
          }
          else if (a.isConnected > b.isConnected) {
            return -1;
          }
          else{
                if (a.max < b.max) {
                    return 1;
                }
                if (a.max > b.max) {
                    return -1;
                }
                return 0;
            }
        });    

        console.log("termArray3");
        console.log(termArray3);

        computeConnectivity(termArray3, termArray3.length);

        nodes = [];
        var preNodes = [];
        for (var i=0; i<termArray3.length;i++){
            var nod = new Object();
            nod.id = i;
            nod.group = termArray3[i].category;
            nod.name = termArray3[i].term;
            nod.max = termArray3[i].max;
            var maxMonthRelationship = termArray3[i].maxMonth;
            nod.isConnectedMaxMonth = termArray3[i].isConnectedMaxMonth;
            nod.maxMonth = termArray3[i].isConnectedMaxMonth;
            nod.month = termArray3[i].isConnectedMaxMonth;
            nod.x=xStep+xScale(nod.month);   // 2016 initialize x position
            nod.y=height;
            if (nodeY_byName[nod.name]!=undefined)
                nod.y = nodeY_byName[nod.name];
            
            if (termArray3[i].isSearchTerm){
                nod.isSearchTerm =1;
                if (!nod.month)
                    nod.month = termArray3[i].maxMonth;
                if (!nod.isConnectedMaxMonth)
                    nod.isConnectedMaxMonth = termArray3[i].maxMonth;
            }    
            
            if (!maxCount[nod.group] || nod.max>maxCount[nod.group])
                maxCount[nod.group] = nod.max;

            if (termArray3[i].isConnected>0) {  // Only allow connected items
                nodes.push(nod);
            }

        }

        numNode = nodes.length;
        console.log("numNode="+numNode);    // chot numnode

        // compute the monthly data      
        termMaxMax2 = 0;
        for (var i=0; i<numNode; i++){
            nodes[i].monthly = [];
            for (var m=0; m<numMonth; m++){
                var mon = new Object();
                if (terms[nodes[i].name][m]){
                    mon.value = terms[nodes[i].name][m];
                    if (mon.value >termMaxMax2)
                         termMaxMax2 = mon.value ;
                    mon.monthId = m;
                    mon.yNode = nodes[i].y;
                    nodes[i].monthly.push(mon);
                }
            }
            // Add another item to first
            if (nodes[i].monthly.length>0){
               var firstObj = nodes[i].monthly[0];
               if (firstObj.monthId>0){
                    var mon = new Object();
                    mon.value = 0;
                    mon.monthId = firstObj.monthId-1;
                    mon.yNode = firstObj.yNode;
                    nodes[i].monthly.unshift(mon);
               }

                // Add another item
               var lastObj = nodes[i].monthly[nodes[i].monthly.length-1];
               if (lastObj.monthId<numMonth-1){
                    var mon = new Object();
                    mon.value = 0;
                    mon.monthId = lastObj.monthId+1;
                    mon.yNode = lastObj.yNode;
                    nodes[i].monthly.push(mon);
               }
            }
        }

        // Construct an array of only parent nodes
        pNodes = new Array(numNode); //nodes;
        for (var i=0; i<numNode;i++){
            pNodes[i] = nodes[i];
        }

        console.log(pNodes);
        
     //   drawStreamTerm(svg, pNodes, 100, 600) ;

        svg.selectAll(".layer").remove();
        svg.selectAll(".layer")
              .data(pNodes)
              .enter().append("path")
              .attr("class", "layer")
              .style("stroke", function(d) { return d.isSearchTerm ? "#000" : "#000"; })
              .style("stroke-width",0.05)
              .style("stroke-opacity",0.5)
              .style("fill-opacity",0.5)
              .style("fill", function(d, i) {
                return getColor(d.group, d.max);
            });

    }    

    function computeLinks() {
        links = [];
        relationshipMaxMax2 =1;
        
       for (var i=0; i<numNode;i++){        // numNode = 100
            var term1 =  nodes[i].name;
            for (var j=i+1; j<numNode;j++){
                var term2 =  nodes[j].name;
                if (relationship[term1+"__"+term2] && relationship[term1+"__"+term2].max>=valueSlider){
                    // let cate = category[term1+"__"+term2];
                    // let type = Object.keys(cate).reduce(function(a, b){ return cate[a] > cate[b] ? a : b });
                    for (var m=1; m<numMonth;m++){
                        if (relationship[term1+"__"+term2][m] && relationship[term1+"__"+term2][m]>=valueSlider){
                            var type = relationship[term1+"__"+term2]["type_" +m];
                            var sourceNodeId = i;
                            var targetNodeId = j;
                            
                            if (!nodes[i].connect)
                                nodes[i].connect = new Array();
                            nodes[i].connect.push(j)
                            if (!nodes[j].connect)
                                nodes[j].connect = new Array();
                            nodes[j].connect.push(i)

                            if (m != nodes[i].maxMonth){
                                if (isContainedChild(nodes[i].childNodes,m)>=0){  // already have the child node for that month
                                    sourceNodeId =  nodes[i].childNodes[isContainedChild(nodes[i].childNodes,m)];
                                }  
                                else{  
                                    var nod = new Object();
                                    nod.id = nodes.length;
                                    nod.group = nodes[i].group;
                                    nod.name = nodes[i].name;
                                    nod.max = nodes[i].max;
                                    nod.maxMonth = nodes[i].maxMonth;
                                    nod.month = m;
                                    
                                    nod.parentNode = i;   // this is the new property to define the parent node
                                    if (!nodes[i].childNodes)
                                         nodes[i].childNodes = new Array();
                                    nodes[i].childNodes.push(nod.id);
                                    
                                    sourceNodeId = nod.id;
                                    nodes.push(nod);
                                }
                            }
                            if (m != nodes[j].maxMonth){
                                if (isContainedChild(nodes[j].childNodes,m)>=0){
                                    targetNodeId = nodes[j].childNodes[isContainedChild(nodes[j].childNodes,m)];
                                }
                                else{    
                                    var nod = new Object();
                                    nod.id = nodes.length;
                                    nod.group = nodes[j].group;
                                    nod.name = nodes[j].name;
                                    nod.max = nodes[j].max;
                                    nod.maxMonth = nodes[j].maxMonth;
                                    nod.month = m;
                                    
                                    nod.parentNode = j;   // this is the new property to define the parent node
                                     if (!nodes[j].childNodes)
                                         nodes[j].childNodes = new Array();
                                    nodes[j].childNodes.push(nod.id);
                                    
                                    targetNodeId = nod.id;
                                    nodes.push(nod);
                                }    
                            }
                            
                            var l = new Object();
                            l.source = sourceNodeId;
                            l.target = targetNodeId;
                            l.m = m;
                            l.type = type;
                            //l.value = linkScale(relationship[term1+"__"+term2][m]); 

                            if (relationship[term1+"__"+term2][m] > relationshipMaxMax2)
                                relationshipMaxMax2 = relationship[term1+"__"+term2][m];
                            links.push(l);
                        }
                    }
                }
            }
        }
        
       // var linear = (150+numNode)/200;
        var hhh = Math.min(height/numNode,20);
        
        yScale = d3.scale.linear()
            .range([0, hhh*1.25])
            .domain([0, termMaxMax2]);
        // linkScale = d3.scale.linear()
        //     .range([1.2, 4])
        //     .domain([Math.round(valueSlider)-0.4, Math.max(relationshipMaxMax2,10)]);

        linkScale = d3.scale.linear()
            .range([1.2, 3])
            .domain([1,2]);

        links.forEach(function(l) { 
            var term1 = nodes[l.source].name;
            var term2 = nodes[l.target].name;
            var month = l.m;
            l.value = linkScale(relationship[term1+"__"+term2]["intensity_"+month]);
        }  );  

        console.log("DONE links relationshipMaxMax2="+relationshipMaxMax2);

        //Create all the line svgs but without Interstates yet
        svg.selectAll(".linkArc").remove();
        linkArcs = svg.append("g").selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("class", "linkArc")
        .style("stroke-width", function (d) {
            return d.value ;
        })
            .style("stroke", (d,i) => {
                if (d.type === "Extrasystemic") {
                    return color(0);
                }
                else if (d.type === "Interstate") {
                    return color(1)
                }
                else if (d.type === "Internal") {
                    return color(2)
                }
                else if (d.type === "Internationalized internal") {
                    return color(3)
                }
            })
        ;

        svg.selectAll(".nodeG").remove();
        nodeG = svg.selectAll(".nodeG")
            .data(pNodes).enter().append("g")
            .attr("class", "nodeG")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"
            })
         /*
        nodeG.append("circle")
            .attr("class", "node")
            .attr("r", function(d) { return Math.sqrt(d.max) })
            .style("fill", function (d) {return getColor(d.group, d.max);})
            .on('dblclick', releasenode)
            .call(node_drag); //Added
        */
     // console.log("  nodes.length="+nodes.length) ; 
          
        svg.selectAll(".nodeText").remove();
        nodeG.append("text")
            .attr("class", ".nodeText")
            .attr("dy", ".35em")
            .style("fill", "#000000")   
            .style("text-anchor","end")
            .style("text-shadow", "1px 1px 0 rgba(255, 255, 255, 0.6")
            .style("font-weight", function(d) { return d.isSearchTerm ? "bold" : ""; })
            .attr("dy", ".21em")
            .attr("font-family", "sans-serif")
            .attr("font-size", function(d) { return d.isSearchTerm ? "20px" : "19px"; })
            .text(function(d) { return d.name });  
        nodeG.on('mouseover', mouseovered)
               .on("mouseout", mouseouted); 

          // console.log("gggg**************************"+searchTerm);
        listMonth = [];
        links.forEach(function(l) { 
            if (searchTerm!=""){
                if (nodes[l.source].name == searchTerm || nodes[l.target].name == searchTerm){
                    if (isContainedInteger(listMonth,l.m)<0)
                        listMonth.push(l.m);
                }
            }    
        }); 
        listMonth.sort(function (a, b) {
          if (a > b) {
            return 1;
          }
          else if (a < b) {
            return -1;
          }
          else
            return 0;
        });    
         
    }    


$('#btnUpload').click(function() {
    var bar = document.getElementById('progBar'),
        fallback = document.getElementById('downloadProgress'),
        loaded = 0;

    var load = function() {
        loaded += 1;
        bar.value = loaded;

        /* The below will be visible if the progress tag is not supported */
        $(fallback).empty().append("HTML5 progress tag not supported: ");
        $('#progUpdate').empty().append(loaded + "% loaded");

        if (loaded == 100) {
            clearInterval(beginLoad);
            $('#progUpdate').empty().append("Upload Complete");
            console.log('Load was performed.');
        }
    };

    var beginLoad = setInterval(function() {
        load();
    }, 50);

});

function mouseovered(d) {
    if (force.alpha()==0) {
        var list = new Object();
        list[d.name] = new Object();

        svg.selectAll(".linkArc")
            .style("stroke-opacity" , function(l) {  
                if (l.source.name==d.name){
                    if (!list[l.target.name]){
                        list[l.target.name] = new Object();
                        list[l.target.name].count=1; 
                        list[l.target.name].year=l.m;  
                        list[l.target.name].linkcount=l.count;    
                    }    
                    else{
                        list[l.target.name].count++; 
                        if (l.count>list[l.target.name].linkcount){
                            list[l.target.name].linkcount = l.count;
                            list[l.target.name].year=l.m;  
                        }
                    }    
                    return 1;
                }  
                else if (l.target.name==d.name){
                    if (!list[l.source.name]){
                        list[l.source.name] = new Object();
                        list[l.source.name].count=1; 
                        list[l.source.name].year=l.m;  
                        list[l.source.name].linkcount=l.count;  
                    }    
                    else{
                        list[l.source.name].count++; 
                        if (l.count>list[l.source.name].linkcount){
                            list[l.source.name].linkcount = l.count;
                            list[l.source.name].year=l.m;  
                        } 
                    }    
                    return 1;
                }    
                else
                  return 0.01;  
        });
        nodeG.style("fill-opacity" , function(n) {  
            if (list[n.name])
                return 1;
            else
              return 0.1;  
            })
            .style("font-weight", function(n) { return d.name==n.name ? "bold" : ""; })  
        ;

       nodeG.transition().duration(500).attr("transform", function(n) {
            if (list[n.name] && n.name!=d.name){
                var newX =xStep+xScale(list[n.name].year);
                return "translate(" + newX + "," + n.y + ")"
            }
            else{
                return "translate(" + n.xConnected + "," + n.y + ")"
            }
        })
        svg.selectAll(".layer")
            .style("fill-opacity" , function(n) {  
                if (list[n.name])
                    return 0.7;
                else
                  return 0.1;  
            })
            .style("stroke-opacity" , function(n) {  
                if (list[n.name])
                    return 1;
                else
                  return 0;  
            });
    }                 
}
function mouseouted(d) {
    if (force.alpha()==0) {
        nodeG.style("fill-opacity" , 1);
        svg.selectAll(".layer")
            .style("fill-opacity" ,0.5)
            .style("stroke-opacity" , 0.5);
        svg.selectAll(".linkArc")
            .style("stroke-opacity" , 1);    
        nodeG.transition().duration(500).attr("transform", function(n) {
            return "translate(" +n.xConnected + "," + n.y + ")"
        })   
    }      
}


function searchNode() {
    searchTerm = document.getElementById('search').value;
    valueSlider =2;
    handle.attr("cx", xScaleSlider(valueSlider));   
    
    recompute();
}

   


    // check if a node for a month m already exist.
    function isContainedChild(a, m) {
        if (a){
            for (var i=0; i<a.length;i++){
                var index = a[i];
                if (nodes[index].month==m)
                    return i;
            }
        }
        return -1;
    }

    // check if a node for a month m already exist.
    function isContainedInteger(a, m) {
        if (a){
            for (var i=0; i<a.length;i++){
                if (a[i]==m)
                    return i;
            }
        }
        return -1;
    }

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy)/2;
        if (d.source.y<d.target.y )
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        else
            return "M" + d.target.x + "," + d.target.y + "A" + dr + "," + dr + " 0 0,1 " + d.source.x + "," + d.source.y;
    }

    function update(){
        nodes.forEach(function(d) {
            // if (searchTerm!="")
            //    d.x += (xScale(d.month)-d.x)*0.1;
            //else
            //     d.x += (xScale(d.month)-d.x)*0.005;
            d.x += (width/2-d.x)*0.005;
           
            if  (d.parentNode>=0){
                d.y += (nodes[d.parentNode].y- d.y)*0.5;
              // d.y = nodes[d.parentNode].y;
            } 
            else if (d.childNodes){
                var yy = 0;
                for (var i=0; i< d.childNodes.length;i++){
                    var child = d.childNodes[i];
                    yy += nodes[child].y;
                }
                if (d.childNodes.length>0){
                    yy = yy/d.childNodes.length; // average y coordinate
                    d.y += (yy-d.y)*0.2;
                }
            }
        });    

        if (document.getElementById("checkbox1").checked){
             linkArcs.style("stroke-width", 0);
            
             nodeG.transition().duration(500).attr("transform", function(d) {
                return "translate(" + 200 + "," + d.y + ")"
            })
            svg.selectAll(".nodeText").style("text-anchor","start")
        
        }
        else{
            nodeG.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"
            })
            linkArcs.style("stroke-width", function (d) {
                return d.value;
            });
         }   

        svg.selectAll(".layer")
            .attr("d", function(d) { 
                for (var i=0; i<d.monthly.length; i++){
                    d.monthly[i].yNode = d.y;     // Copy node y coordinate
                }
               return area(d.monthly); 
            });
        linkArcs.attr("d", linkArc);
       // if (force.alpha()<0.03)
       //     force.stop();

       updateTimeLegend();       
    } 

    function updateTransition(durationTime){
        nodes.forEach(function(d) {
           d.x=xStep+xScale(d.month);
            if (d.parentNode>=0){
                d.y= nodes[d.parentNode].y;
            }
            nodeY_byName[d.name]=d.y;      
        });    


        nodeG.transition().duration(durationTime).attr("transform", function(d) {
           d.xConnected=xStep+xScale(d.monthly[0].monthId);
           return "translate(" + d.xConnected + "," + d.y + ")"
        });
         
        /*
        nodeG.style("fill" , function(d) {  
            var color = nodes.forEach(function(node) {
                if (d.name == node.name && d.month!=node.month ){
                    console.log("d.name="+d.name +" node.name="+node.name);
                    console.log("d.month="+d.month +" node.month="+node.month);
                    return "#f0f";
                }      
                else
                    return "#000";
            }); 
            return "#00f";  
        });*/

        /*nodeG.forEach(function(d) {
           d.xConnected=xStep+xScale(d.isConnectedMaxMonth);
        });*/

        /*
        nodeG.attr("transform", function(d) {
            var step = 0;
            d.step=0;
            nodes.forEach(function(node) {
                if (d.name == node.name && d.month!=node.month && node.x<d.x && d.x<node.x+100){
                    d.step=-5000;
                }
            });       
            return "translate(" + (d.x+d.step) + "," + d.y + ")";
        });*/

        svg.selectAll(".layer").transition().duration(durationTime)
          .attr("d", function(d) { 
            for (var i=0; i<d.monthly.length; i++){
                d.monthly[i].yNode = d.y;     // Copy node y coordinate
            }
           return area(d.monthly); }) ;
        linkArcs.transition().duration(250).attr("d", linkArc);     
        updateTimeLegend();
        updateTimeBox(durationTime);
    }    

    function detactTimeSeries(){
       // console.log("DetactTimeSeries ************************************" +data);
        var termArray = [];
        for (var i=0; i< numNode; i++) {
            var e =  {};
            e.y = nodes[i].y;
            e.nodeId = i;
            termArray.push(e);
        }

        termArray.sort(function (a, b) {
          if (a.y > b.y) {
            return 1;
          }
          if (a.y < b.y) {
            return -1;
          }
          return 0;
        });

        // var step = Math.min((height-25)/(numNode+1),15);
        var step = 17;
        //var totalH = termArray.length*step;
        for (var i=0; i< termArray.length; i++) {
            nodes[termArray[i].nodeId].y = 12+i*step;
        }
        force.stop();

        updateTransition(1000);
}


