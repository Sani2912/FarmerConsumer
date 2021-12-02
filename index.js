var http=require('http');
var express=require('express');
var bodyparser=require('body-parser');
var MongoClient=require('mongodb').MongoClient;
var urlencoded=bodyparser.urlencoded({extended:true});
var port = process.env.PORT || 3000;
var regression=require('regression');

var app=express();
app.set('view engine', 'ejs');
app.set("views",__dirname);

var publicDir = require('path').join(__dirname,'/public');
app.use(express.static(publicDir));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/'+'index.html');
})

app.get('/signup',function(req,res){
    res.sendFile(__dirname+'/'+'signup.html');
})

app.get('/login',function(req,res){
    res.sendFile(__dirname+'/'+'login.html');
})

app.post('/registerdo',urlencoded,function(req,res){
    var a=req.body.name;
    var b=req.body.mail;
    var c=req.body.num;
    var d=req.body.passwd;
    var f=req.body.long;
    var g=req.body.lat;
    details={
        name:a,email:b,number:c,password:d,longitude:f,latitude:g,products:[]
    };
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        query={email:b};
            db.collection('users').find(query).toArray(function(err,result){
                if(result[0]){
                    res.sendFile(__dirname+"/already.html");
                }
                else{
                    db.collection('users').insertOne(details,function(err,result){
                    if(err) throw err;
                    res.sendFile(__dirname+"/login.html");
                });
            }
        });
    });
});
//mongodb://localhost:27017
app.post('/logindo',urlencoded,function(req,res){
    var a=req.body.email;
    var b=req.body.passwd;
    var c=req.body.name;
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        query={email:a};
        var details=[];
        db.collection('products').find().toArray(function(err,result){
            Array.prototype.push.apply(details,result);
        });
        db.collection('users').find(query).toArray(function(err,result){
            if(err) throw err;
            if (result[0]){
                if(result[0].password==b){
                db.collection('users').find(query).toArray(function(err,result1){
                    if(err) throw err;
                    details.unshift(result1[0]);
                    // console.log(details[0]);
                    res.render('mainapp',details[0]);
                });
            }
                else{
                res.sendFile(__dirname+"/incorrectpswd.html");
                }
            }
            else{
                res.sendFile(__dirname+"/doregister.html");
            }
        });
    });
})

app.post("/addp",urlencoded,function(req,res){
    var product=req.body.productname;
    var mq=req.body.maxquantity;
    var tq=req.body.totalquantity;
    var price=req.body.price;
    var email=req.body.emailid;
    var lat=req.body.latitude;
    var long=req.body.longitude;
    var products=[];
    var sales={};
    store={product,mq,tq,price,email,lat,long,sales};
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        db.collection('users').find({email:email}).toArray(function(err,result){
            products=result[0].products;
            products.push(store);
            var myquery = { email: email };
            var newvalues = { $set: {products: products, email: email } };
            db.collection("users").updateOne(myquery, newvalues, function(err, res) {
                if (err) throw err;
            });
        });
                   db.collection('products').insertOne(store,function(err,result){
                    if(err) throw err;
                    res.sendFile(__dirname+"/productadded.html");
            });
    });
})
app.post('/list',urlencoded,function(req,res){
    var lat1=req.body.latitude;
    var lon1=req.body.longitude;
    var lat2,lon2;
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        db.collection('products').find().toArray(function(err,result){
           for(var i=0;i<result.length;i++){
                lat2=result[i].lat;
                lon2=result[i].long;
                var unit='K';
            if ((lat1 == lat2) && (lon1 == lon2)) {
                result[i].distance=0;
            }
            else {
                var radlat1 = Math.PI * lat1/180;
                var radlat2 = Math.PI * lat2/180;
                var theta = lon1-lon2;
                var radtheta = Math.PI * theta/180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180/Math.PI;
                dist = dist * 60 * 1.1515;
                if (unit=="K") { dist = dist * 1.609344 }
                if (unit=="N") { dist = dist * 0.8684 }
                result[i].distance=Math.round(dist);
            }
        }
            for(var i=0;i<result.length;i++){
                for(var j=0;j<result.length-1;j++){
                    if(result[j].distance>result[j+1].distance){
                        var t=result[j];
                        result[j]=result[j+1];
                        result[j+1]=t;
                    }
                }
            }
            result.unshift({lon:lon1});
            result.unshift({lat:lat1});
            //res.send(result);
            // console.log(result);
            res.render('mainconsumer',{products:result});
        });
    });
})

app.post('/listsort',urlencoded,function(req,res){
    var lat1=req.body.latitude;
    var lon1=req.body.longitude;
    var lat2,lon2;
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        db.collection('products').find().toArray(function(err,result){
           for(var i=0;i<result.length;i++){
                lat2=result[i].lat;
                lon2=result[i].long;
                var unit='K';
            if ((lat1 == lat2) && (lon1 == lon2)) {
                result[i].distance=0;
            }
            else {
                var radlat1 = Math.PI * lat1/180;
                var radlat2 = Math.PI * lat2/180;
                var theta = lon1-lon2;
                var radtheta = Math.PI * theta/180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180/Math.PI;
                dist = dist * 60 * 1.1515;
                if (unit=="K") { dist = dist * 1.609344 }
                if (unit=="N") { dist = dist * 0.8684 }
                result[i].distance=Math.round(dist);
            }
        }
        for(i=0;i<result.length;i++){
            delete result[i]._id;
        }
        function partition(array, left, right) {
            var cmp =  Number(array[right - 1].price),
                minEnd = left,
                maxEnd;
            for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
                if (Number(array[maxEnd].price) <= cmp) {
                    swap(array, maxEnd, minEnd);
                    minEnd += 1;
                }
            }
            swap(array, minEnd, right - 1);
            return minEnd;
        }
    
        function swap(array, i, j) {
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            return array;
        }
    
        function quickSort(array, left, right) {
            if (left < right) {
                var p = partition(array, left, right);
                quickSort(array, left, p);
                quickSort(array, p + 1, right);
            }
            return array;
        }
        result=quickSort(result,0,result.length);
            result.unshift({lon:lon1});
            result.unshift({lat:lat1});
            res.render('mainconsumer',{products:result});
        });
    });
})
app.post('/search',urlencoded,function(req,res){
    var lat1=req.body.latitude;
    var lon1=req.body.longitude;
    var search=req.body.search;
    var lat2,lon2;
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        db.collection('products').find().toArray(function(err,result){
           for(var i=0;i<result.length;i++){
                lat2=result[i].lat;
                lon2=result[i].long;
                var unit='K';
            if ((lat1 == lat2) && (lon1 == lon2)) {
                result[i].distance=0;
            }
            else {
                var radlat1 = Math.PI * lat1/180;
                var radlat2 = Math.PI * lat2/180;
                var theta = lon1-lon2;
                var radtheta = Math.PI * theta/180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180/Math.PI;
                dist = dist * 60 * 1.1515;
                if (unit=="K") { dist = dist * 1.609344 }
                if (unit=="N") { dist = dist * 0.8684 }
                result[i].distance=Math.round(dist);
            }
        }
            for(var i=0;i<result.length;i++){
                for(var j=0;j<result.length-1;j++){
                    if(result[j].distance>result[j+1].distance){
                        var t=result[j];
                        result[j]=result[j+1];
                        result[j+1]=t;
                    }
                }
            }
            var products = result.filter(function(value, index, arr){
                return result[index].product == search;
            
            });
            products.unshift({search:search});
            products.unshift({lon:lon1});
            products.unshift({lat:lat1});
            //res.send(result);
            res.render('mainconsumer1',{products:products});
        });
    });
})

app.post('/listsort1',urlencoded,function(req,res){
    var lat1=req.body.latitude;
    var lon1=req.body.longitude;
    var search=req.body.search;
    var lat2,lon2;
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        db.collection('products').find().toArray(function(err,result){
           for(var i=0;i<result.length;i++){
                lat2=result[i].lat;
                lon2=result[i].long;
                var unit='K';
            if ((lat1 == lat2) && (lon1 == lon2)) {
                result[i].distance=0;
            }
            else {
                var radlat1 = Math.PI * lat1/180;
                var radlat2 = Math.PI * lat2/180;
                var theta = lon1-lon2;
                var radtheta = Math.PI * theta/180;
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                if (dist > 1) {
                    dist = 1;
                }
                dist = Math.acos(dist);
                dist = dist * 180/Math.PI;
                dist = dist * 60 * 1.1515;
                if (unit=="K") { dist = dist * 1.609344 }
                if (unit=="N") { dist = dist * 0.8684 }
                result[i].distance=Math.round(dist);
            }
        }
        var products = result.filter(function(value, index, arr){
            return result[index].product == search;
        
        });
        function partition(array, left, right) {
            var cmp =  Number(array[right - 1].price),
                minEnd = left,
                maxEnd;
            for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
                if (Number(array[maxEnd].price) <= cmp) {
                    swap(array, maxEnd, minEnd);
                    minEnd += 1;
                }
            }
            swap(array, minEnd, right - 1);
            return minEnd;
        }
    
        function swap(array, i, j) {
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            return array;
        }
    
        function quickSort(array, left, right) {
            if (left < right) {
                var p = partition(array, left, right);
                quickSort(array, left, p);
                quickSort(array, p + 1, right);
            }
            return array;
        }
        products=quickSort(products,0,products.length);
            products.unshift({search:search});
            products.unshift({lon:lon1});
            products.unshift({lat:lat1});
            //res.send(result);
            res.render('mainconsumer1',{products:products});
        });
    });
})
app.post('/deletep',urlencoded,function(req,res){
    var a=req.body.product;
    var b=req.body.farmer;
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        db.collection('users').find({email:b}).toArray(function(err,result){
            products=result[0].products;
            for(var i=0;i<products.length;i++){
                var str=products[i].product;
                var n = str.localeCompare(a);
                if(n==0){
                    var product=products.splice(i,1);
                }
            }
            var myquery = { email: b };
            var newvalues = { $set: {products: products, email: b } };
            db.collection("users").updateOne(myquery, newvalues, function(err, res) {
                if (err) throw err;
            });
        });
        var query={email:b,product:a};
                   db.collection('products').deleteOne(query,function(err,result){
                    if(err) throw err;
                    res.sendFile(__dirname+"/productdeleted.html");
            });
    });
})
app.post("/buy",urlencoded,function(req,res){
    var product=req.body.product;
    var price=req.body.price;
    var email=req.body.farmer;
    var quantity=req.body.quan;
    var mq=req.body.mq;
    var o={product,price,email,quantity};
    var p={product,email};
    quantity=Number(quantity);
    mq=Number(mq);
    if(quantity<mq){
        res.sendFile(__dirname+"/nomin.html");
    }
    else if(quantity > 50){
        res.sendFile(__dirname+"/maxreached.html");
    }
    else{
             MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
             if(err) throw err;
             var db=db.db('farmerlogindb');
                   db.collection('products').find({product:product,email:email}).toArray(function(err,result){
                    if(err) throw err;
                    var tq=Number(result[0].tq);
                    var sales=result[0].sales;
                    if(tq>quantity){
                    tq=tq-quantity;
                    var query={product:product,email:email};
                        var date=new Date();
                        var m=String(date.getDate());
                        var d=String(date.getMonth());
                        var y=String(date.getFullYear());
                        var datef=m.concat(d,y);
                        if(datef in sales){
                            sales[datef]=sales[datef]+quantity;
                        }
                        else{
                            sales[datef]=quantity;
                        }
                        var newvalue ={$set: {product:product,email:email,tq:tq,sales:sales}};
                     db.collection("products").updateOne(query, newvalue, function(err, res) {
                                     if (err) throw err;
                     });
                        res.sendFile(__dirname+"/order.html");
                    }
                    else{
                        res.sendFile(__dirname+"/na.html");
                    }
            });
        });
    }
    // MongoClient.connect('mongodb://harsha:harsha@harsha1-shard-00-00.ashl9.mongodb.net:27017,harsha1-shard-00-01.ashl9.mongodb.net:27017,harsha1-shard-00-02.ashl9.mongodb.net:27017/test?ssl=true&replicaSet=harsha1-shard-0&authSource=admin&retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
    //     if(err) throw err;
    //     var db=db.db('farmerlogindb');
    //     db.collection('users').find({email:email}).toArray(function(err,result){
    //         products=result[0].products;
    //         products.push(store);
    //         var myquery = { email: email };
    //         var newvalues = { $set: {products: products, email: email } };
    //         db.collection("users").updateOne(myquery, newvalues, function(err, res) {
    //             if (err) throw err;
    //         });
    //     });
    //                db.collection('products').insertOne(store,function(err,result){
    //                 if(err) throw err;
    //                 res.sendFile(__dirname+"/productadded.html");
    //         });
    // });
})
app.post("/predict",urlencoded,function(req,res){
    var product=req.body.product;
    var email=req.body.farmer;
    MongoClient.connect('mongodb+srv://sani:<12345>@cluster0.fgwvp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{ useNewUrlParser: true },function(err,db){
        if(err) throw err;
        var db=db.db('farmerlogindb');
        db.collection('products').find({product:product,email:email}).toArray(function(err,result){
            var sales=result[0].sales;
            var arr=Object.values(sales);
            var arr1=[],count=0;
            var n=arr.length;
            if(n>=7){
            for(var i=0;i<n;i++){
                var a=[];
                a.push(count);
                a.push(Number(arr[n-i-1]));
                arr1.push(a);
                count++;
            }
            const result1 = regression.linear(arr1);
            var prediction=[],err=0;
            for(i=0;i<n;i++){
                err=err+Math.abs(arr1[i][1]-result1.predict(i)[1]);
            }
            err=err/n;
            for(var j=0;j<7;j++){
                var pred=result1.predict(count+j);
                prediction.push(pred);
            }
            const result2 = regression.polynomial(arr1, { order: 2 });
            var prediction1=[],err1=0;
            for(i=0;i<n;i++){
                err1=err1+Math.abs(arr1[i][1]-result2.predict(i)[1]);
            }
            err1=err1/n;
            for(var j=0;j<7;j++){
                var pred=result2.predict(count+j);
                prediction1.push(pred);
            }
            if(err<err1){
                var x=[];
                var y=[];
                for(i=0;i<7;i++){
                    x.push(prediction[i][0]);
                    y.push(prediction[i][1]);
                }
                 const data = [{x:x, y:y, type: 'scatter',name:"Predicted Sales of next weeek"}];
                 res.render('predictr',{predicted:prediction});
            }
            else{
                var x=[];
                var y=[];
                for(i=0;i<7;i++){
                    x.push(prediction[i][0]);
                    y.push(prediction[i][1]);
                }
                const data = [{x:x, y:y, type: 'scatter',name:"Predicted Sales of next weeek"}];
                res.render('predictr',{predicted:prediction});
            }
        }
        else{
            res.sendFile(__dirname+"/noep.html");
        }
        });
    });
})
app.listen(port);