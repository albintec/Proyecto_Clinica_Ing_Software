//1 - invocamos a express
const express = require('express');
const app = express();

//2 - seteamos urlencoded
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//invocamos dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});

//directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//motor de plantillas
app.set('view engine', 'ejs');

//bcryptjs
const bcryptjs = require('bcryptjs');

//var de session
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//console.log(__dirname);

//Invocamos la conexion con la BD
const connection = require('./database/db');
const { application } = require('express');
const e = require('express');

//establecemos las rutas
//app.get('/', (req,res)=> {
  //  res.render('index', {msg:'esto es un mensaje desde node'});
//})
app.get('/login', (req,res)=> {
    res.render('login');
})
app.get('/register', (req,res)=> {
    res.render('register');
})
app.get('/admin', (req, res)=>{
    connection.query('SELECT * FROM doctores', (error, results)=>{
        if(error){
            throw error;
        }else {
            res.render('admin', {results:results});
        }
    })
    })
    
app.get('/create', (req, res)=>{
    res.render('create');
})


app.get('/edit/:id', (req, res)=> {
    const id = req.params.id;
    connection.query('SELECT * FROM doctores WHERE id_doctor=?', [id], (error, results)=>{
        if(error){
            throw error;
        }else{
            res.render('edit', {doctores:results[0]});
        }
    })
})
app.get('/cliente', (req, res)=>{
    res.render('cliente',{
        login: true,
        name: req.session.name
    });
})
app.get('/citas', (req, res)=>{
    if(req.session.loggedin){
         res.render('citas', {
             login: true,
            name: req.session.name
         });
    }else {
        res.render('citas', {
            login: false,
            name: 'Debe iniciar sesion'
        })
    }
})

app.get('/', (req,res)=>{
    res.render('index');
})

app.get('/contacto', (req,res)=>{
    res.render('contacto');
})





//registro
app.post('/register', async (req, res)=> {
      const nombre = req.body.name;
      const cedula = req.body.id;
      const fecha_nacimiento = req.body.date;
      const genero = req.body.gender;
      const direccion = req.body.address;
      const telefono = req.body.telephone;
      const correo = req.body.email;
      const clave = req.body.password;
      let passwordHash = await bcryptjs.hash(clave,8);
      connection.query('INSERT INTO paciente SET ?', {nombre, cedula, direccion, telefono,
       correo, clave:passwordHash, genero, fecha_nacimiento}, async(error,results)=>{
           if(error){
               console.log(error);
           }else {
               res.render('register', {
                   alert: true,
                   alertTitle: "Registro",
                   alertMessage: "¡Registro Completado!",
                   alertIcon: 'success',
                   showConfirmButton: false,
                   timer: 1500,
                   ruta: ''
               })
           }
       })
})

app.post('/misCitas', async (req, res)=>{
    const paciente = req.body.nombre;
    const correo = req.body.correo;
    const id_doctor = req.body.especialidad;
    const mensaje = req.body.mensaje;
    const fecha_registro_cita = req.body.date;
    connection.query('INSERT INTO cita SET ?', {paciente, id_doctor, mensaje, fecha_registro_cita, correo}, async(error,results)=>{
        if(error){
            console.log(error);
        }else{
            res.render('misCitas', {
                alert: true,
                alertTitle: "Cita Registrada",
                alertMessage: "¡Registro Completado!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: ''
            })
        }
    })

})

// app.get('/misCitas', (req, res)=>{
//     connection.query('SELECT * FROM cita', (error, results)=>{
//         if(error){
//             throw error;
//         }else {
//             res.render('misCitas', {results:results});
//         }
//     })
//     })

/////////////////////////////////////////////////////////////////////////////
app.post('/create', async(req,res)=>{
    const nombre= req.body.nombre;
    const apellido= req.body.apellido;
    const especialidad= req.body.especialidad;
    const telefono= req.body.telefono;
    connection.query('INSERT INTO doctores SET ?', {nombre, apellido, especialidad, telefono}, 
    async(error,results)=>{
           if(error){
               console.log('error');
           }else{
               res.render('create', {
                   alert: true,
                   alertTitle: "Registro",
                   alertMessage: "¡Registro Completado!",
                   alertIcon: 'success',
                   showConfirmButton: false,
                   timer: 1500,
                   ruta: ''
               })
           }
    })

})
///////////////////////////////////////////////
app.post('/update', (req, res)=>{
    const nombre= req.body.nombre;
    const apellido= req.body.apellido;
    const especialidad= req.body.especialidad;
    const telefono= req.body.telefono;
    const id_doctor= req.body.id;
    connection.query('UPDATE doctores SET ? WHERE id_doctor= ?', [{nombre,apellido,especialidad,telefono}, id_doctor],
     (error,results)=>{
         if(error){
             console.log('error' +error);
         }else{
             res.redirect('admin');
         }
     })  })
    //////////////////////////////////////////////////
    app.get('/admin/:id', (req, res)=>{
        const id_doctor = req.params.id;
        connection.query('DELETE FROM doctores WHERE id_doctor = ?', [id_doctor], (error, results)=>{
            if(error){
                console.log('error' + error);
            }else{
                res.redirect('/admin');
            }
        })
    })
//Autenticación
app.post('/auth', async(req, res)=>{
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass,8);
    if(user == 'admin' && pass == 'ingsoftware') {
        req.session.loggedin = true;
        res.render('/admin',{
            alert: true,
            alertTitle: "Conexión exitosa",
            alertMessage: "¡LOGIN CORRECTO!",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: ''
        });
    } else {
    if(user && pass){
        connection.query('SELECT * FROM paciente WHERE correo = ?', [user], async(error,results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].clave))){
                res.render('login',{
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o contraseña incorrectas",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            }else{
                req.session.loggedin = true;
                req.session.name = results[0].nombre;
                req.session.id = results[0].id_doctor;
                res.render('login',{
                    alert: true,
                    alertTitle: "Conexión exitosa",
                    alertMessage: "¡LOGIN CORRECTO!",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: ''
                });
            }
        })
    }
}}) 

//auth pages
// app.get('/', (req, res)=>{
//     if(req.session.loggedin){
//         res.render('index', {
//             login: true,
//             name: req.session.name
//         });
//     }else {
//         res.render('index', {
//             login: false,
//             name: 'Debe iniciar sesion'
//         })
//     }
// })
 

//logout
app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

app.listen(process.env.PORT || 3000, (req,res)=> {
    console.log('server corriendo en localhost 3000')
})