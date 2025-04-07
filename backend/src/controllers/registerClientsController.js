import jsonwebtoken from "jsonwebtoken"; //token 
import bcryptjs from "bcryptjs"; //encriptar
import nodemailer from "nodemailer"; //Enviar correo
import crypto from "crypto"; //codigo aleatorio

import clientsModel from "../models/customers.js";
import { config } from "../config.js";
import { error } from "console";

//array de funciones

const registerClientsController =  {};

registerClientsController.register = async (req, res) =>{
    //1- Solicitar los datos 
    const {
        name,
        lastName,
        birthday,
        email,
        password,
        telephone,
        dui,
        isVerified
    } = req.body

    try {
        //Verificamos si el cliente ya existe
        const existingClient = await clientsModel.findOne({email})
        if(existingClient){
            return res.json({message: "Client already exist"})
        }

        //Encriptar la contraseña
        const passwordHash = bcryptjs.hash(password, 10);

        //Guardo el cliente en la base de datos
        const newClient = new clientsModel({
            name,
            lastName,
            birthday,
            email,
            password,
            telephone,
            dui: dui || null,
            isVerified: isVerified || false
        });

        await newClient.save(); 

        //Generar un codigo aleatorio para enviarlo por correo
        const vericationCode = crypto.randomBytes(3).toString("hex")

        //Generar un token que contenga el codigo de verificacion 
        const tokenCode = jsonwebtoken.sign(

            //1- Que voy a guardar? 
            {email, vericationCode},

            //Secret key
            config.JWT.secret,

            //Cuando expira
            {expiresIn: "2h"}
        )

        res.cookie("vericationToken", tokenCode, {maxAge: 2*60*60*1000})

        //Enviar el correo electronico

        //1- Transportar => quien lo envia
        const Transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: config.email.email_user,
                pass: config.email.email_pass
            }
        })

        //mailOptions => quien lo recibe
        const mailOptions = {
            from: config.email.email_user,
            to: email,
            subject: "Verificacion de correo",
            text: "Para verificar tu cuenta, utiliza el siguiente codigo : " + verificationCode + "Expira en dos horas"
        };

        //3- Enviar el correo
        Transporter.sendMail(mailOptions, (error, info)=>{
            if(error){
                return res.json({ message: "Error sending email" + error })
            }
            console.log("email sent" + info);
        });

        res.json({message: "Client registeres, please verify your email with the code sent"})

    
        }  catch (error){ 
           console.log("error" + error)
        }

    };

    registerClientsController.verifyCodeEmail = async (req, res) =>{

        const { requireCode } = req.body;

        //Obtengo el token guardado en las cookies 
        const token = req.cookies.vericationToken;

        try{

            //Verificar y decodificar el token 
            const decoded = jsonwebtoken.verify(token, config.JWT.secret)
            const {email, vericationCode: storedCode} = decoded;

            //Comparar el codigo que envie por correo y esta guardado
            //en las cookies, con el codigo que el usuario
            //esta ingresando

            if(requireCode !== storedCode){
                return res.json({message: "Invalid code"})
            }
            
            //Marcamos al cliente como verificado 
            const client = await clientsModel.findOne({email});
            client.isVerified = true;
            await client.save();

            res.clearCookie("verificationToken");

            res.json({message: "Email verified successfuly"})


        } catch(error){
            console.log("error" + error); 
        }
    };

    export default registerClientsController;