import express from 'express'
import cors from 'cors'
import pg from 'pg'
import joi from 'joi'
import dayjs from 'dayjs'

const app = express()
app.use(cors())
app.use(express.json())

const { Pool } = pg;

const connection = new Pool ({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
})

app.get('/categories', async (req,res) => {
    const offset = req.query.offset
    const limit = req.query.limit

    try {

        if(offset) {
            const result = await connection.query('SELECT * FROM categories OFFSET $1 ROWS', [offset])
            return res.send(result.rows)
        }

        if(limit) {
            const result = await connection.query('SELECT * FROM categories LIMIT $1', [0, limit-1])
            return res.send(result.rows)
        }

        if(limit && offset) {
            const result = await connection.query('SELECT * FROM categories LIMIT $1', [offset, limit-1])
            return res.send(result.rows)
        }

        const result = await connection.query('SELECT * FROM categories');
        return res.send(result.rows);
    }
    catch {
        return res.sendStatus(404)
    }
})

app.post('/categories', async (req,res) => {

    const schema = joi.object({
        name: joi.string().required()
    })
    const isValid = schema.validate(req.body)
    if(isValid.error) return res.sendStatus(400)

    try {
        const name = req.body.name
        const verifyName = await connection.query('SELECT * FROM categories WHERE name = $1', [name])
        console.log(verifyName)
        if (verifyName.rows.length) return res.sendStatus(409)

        await connection.query('INSERT INTO categories (name) VALUES ($1)', [req.body.name])
        return res.sendStatus(201)
    }
    catch {
        return res.sendStatus(404)
    }
})

app.get('/games', async (req,res) => {
    const name = req.query.name

    try {
        if(name) {
            const result = await connection.query('SELECT games.*, categories.name FROM games JOIN categories ON games."categoryId" = categories.id WHERE name ILIKE $1', [`${name}%`]);
            return res.send(result.rows)
        }

        const result = await connection.query('SELECT games.*, categories.name FROM games JOIN categories ON games."categoryId" = categories.id')
        return res.status(201).send(result.rows)
    }
    catch {
        return res.sendStatus(404)
    }
})

app.post('/games', async (req,res) => {

    const {name, image, stockTotal, categoryId, pricePerDay} = req.body

    const schema = joi.object({
        name: joi.string().required(),
        image: joi.string().uri().required(),
        stockTotal: joi.number().positive().integer().required(),
        categoryId: joi.number().positive().integer().required(),
        pricePerDay: joi.number().positive().integer().required()
    })
    const isValid = schema.validate(req.body)
    if(isValid.error) return res.sendStatus(400)

    try{
        const categories = await connection.query('SELECT * FROM categories WHERE id = $1', [categoryId])
        if(!categories.rows.length) return res.sendStatus(400)
        
        const nameExists = await connection.query('SELECT * FROM games WHERE name = $1', [name])
        if(nameExists.rows.length) return res.sendStatus(409)

        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)', 
        [name, image, stockTotal, categoryId, pricePerDay])

        return res.sendStatus(201)
    }
    catch (e){
        console.log(e)
        return res.sendStatus(404)
    }
})

app.get('/customers', async (req,res) => {
    const cpf = req.query.cpf

    try {
        if(cpf) {
            await connection.query('SELECT * FROM customers WHERE cpf ILIKE $1', [`${cpf}$`]);
            return res.send(result.rows)
        }
        const result = await connection.query('SELECT * FROM customers');
        return res.send(result.rows);
    }
    catch {
        return res.sendStatus(404)
    }
})

app.get('/customers/:id', async (req,res) => {
    const id = +req.params.id

    try {
        const result = await connection.query('SELECT * FROM customers WHERE id = $1', [id])
        if(!result.rows.length) return res.sendStatus(404)
        return res.send(result.rows)
    }
    catch {
        return res.send(404)
    }
})

app.post('/customers', async (req,res) => {

    const {name, phone, cpf, birthday} = req.body

    const schema = joi.object ({
        name: joi.string().required(),
        cpf: joi.string().pattern(/^[0-9]{3}[0-9]{3}[0-9]{3}[0-9]{2}$/, "CPF inválido").required(),
        phone: joi.string().pattern(/[10-11]/).required(),
        birthday: joi.date().required()
    })
    const isValid = schema.validate(req.body)
    if (isValid.error) return res.sendStatus(400)

    try {
        const cpfExists = await connection.query('SELECT * FROM customers WHERE cpf = $1', [cpf])
        if(cpfExists.rows.length) return res.sendStatus(409)
        await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)', [name, phone, cpf, birthday])
        return res.sendStatus(201)
    }
    catch (e) {
        console.log(e)
        return res.sendStatus(404)
    }
})

app.put('/customers/:id', async (req,res) => {

    const id = +req.params.id
    let {name, phone, cpf, birthday} = req.body

    const schema = joi.object ({
        name: joi.string(),
        cpf: joi.string().pattern(/^[0-9]{3}[0-9]{3}[0-9]{3}[0-9]{2}$/, "CPF inválido"),
        phone: joi.string().pattern(/[10-11]/),
        birthday: joi.date()
    })
    const isValid = schema.validate(req.body)
    if (isValid.error) return res.sendStatus(400)

    try {
        if(cpf) {
            const cpfExists = await connection.query('SELECT * FROM customers WHERE cpf = $1', [cpf])
            if(cpfExists.rows.length) return res.sendStatus(409)
        }

        const customer = await connection.query('SELECT * FROM customers WHERE id = $1', [id])
        if (!customer.rows.length) return res.sendStatus(404)
        name = req.body.name || customer.rows[0].name
        cpf = req.body.cpf || customer.rows[0].cpf
        phone = req.body.phone || customer.rows[0].phone
        birthday = req.body.birthday || customer.rows[0].birthday
    
        const update = await connection.query('UPDATE customers SET name = $1, cpf = $2, phone = $3, birthday = $4 WHERE id = $5 returning *', [name, cpf, phone, birthday, id]) 
        return res.send(update.rows[0])
    }
    catch (e) {
        console.log(e)
        return res.sendStatus(500)
    }
})

app.get('/rentals', async (req,res) => {

    const customerId = req.query.customerId
    const gameId = req.query.gameId

    try {
        if(customerId) {
            const result = await connection.query(`SELECT rentals.*, 
                                                    jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
                                                    jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', 
                                                    games."categoryId", 'categoryName', categories.name) 
                                                    AS game            
                                                    FROM rentals 
                                                    JOIN customers ON rentals."customerId" = customers.id
                                                    JOIN games ON rentals."gameId" = games.id
                                                    JOIN categories ON categories.id = games."categoryId"
                                                    WHERE rentals."customerId" = $1`, [customerId])
            return res.send(result.rows)
        }

        if(gameId) {
            const result = await connection.query(`SELECT rentals.*, 
                                                jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
                                                jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', 
                                                games."categoryId", 'categoryName', categories.name) 
                                                AS game            
                                                FROM rentals 
                                                JOIN customers ON rentals."customerId" = customers.id
                                                JOIN games ON rentals."gameId" = games.id
                                                JOIN categories ON categories.id = games."categoryId"
                                                WHERE rentals."gameId" = $1`, [gameId])
            return res.send(result.rows)
        }

        const result = await connection.query(`SELECT rentals.*, 
                                                jsonb_build_object('name', customers.name, 'id', customers.id) AS customer,
                                                jsonb_build_object('id', games.id, 'name', games.name, 'categoryId', 
                                                games."categoryId", 'categoryName', categories.name) 
                                                AS game            
                                                FROM rentals 
                                                JOIN customers ON rentals."customerId" = customers.id
                                                JOIN games ON rentals."gameId" = games.id
                                                JOIN categories ON categories.id = games."categoryId"`);
        return res.send(result.rows).status(200) 
    }

    catch {
        return res.sendStatus(500)
    }
})

app.post('/rentals', async (req,res) => {

    const {customerId, gameId, daysRented} = req.body
    const rentDate = dayjs().format('YYYY-MM-DD')
    let returnDate = null;
    let delayFee = null;

    const schema = joi.object({
        customerId: joi.number().positive().integer().required(),
        gameId: joi.number().positive().integer().required(),
        daysRented: joi.number().positive().integer().required(),
    })
    const isValid = schema.validate(req.body)
    if(isValid.error) return res.sendStatus(404)

    try {
        const customerExists = await connection.query('SELECT * FROM customers WHERE id = $1', [customerId])
        if (!customerExists.rows.length) return res.sendStatus(400)

        const rentalsResult = await connection.query('SELECT * FROM rentals WHERE "returnDate" IS NULL')
        const resultGames = await connection.query('SELECT * FROM games')
        if(rentalsResult.rows.length >= resultGames.rows.length) return res.sendStatus(400)

        const resultGame = await connection.query('SELECT * FROM games WHERE id = $1', [gameId, ])
        if (!resultGame.rows.length) return res.sendStatus(400)
        const originalPrice = daysRented * resultGame.rows[0].pricePerDay

        const result = await connection.query(`INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") 
                                VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
                                [customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee])
        return res.sendStatus(201)
    }
    catch (e) {
        console.log(e)
        return res.sendStatus(500)
    }
})

app.post('/rentals/:id/return', async (req,res) => {

    const rentalId = req.params.id
    const today = dayjs();

    try {
        const rental = await connection.query('SELECT * FROM rentals WHERE id = $1', [rentalId])
        if (!rental.rows.length) return res.sendStatus(404)
        if (rental.rows[0].returnDate !== null) return res.sendStatus(400)

        const game = await connection.query('SELECT * FROM games WHERE id = $1', [rental.rows[0].gameId])

        const initialDay = rental.rows[0].rentDate
        const lateDays = Math.round((new Date(today).getTime() - new Date(initialDay).getTime())/86400000);

        const fee = lateDays * (game.rows[0].pricePerDay);

        await connection.query('UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3',
                                [today, fee, rentalId])
        
        return res.sendStatus(200)
    }
    catch (e) {
        return res.sendStatus(500)
    }
})

app.delete('/rentals/:id', async (req,res) => {
    const rentalId = req.params.id

    try {
        const rentalExists = await connection.query('SELECT * FROM rentals WHERE id = $1', [rentalId])
        if(!rentalExists.rows.length) return res.sendStatus(404)
        console.log(rentalExists.rows[0])
        if(rentalExists.rows[0].returnDate) return res.sendStatus(400)

        await connection.query('DELETE FROM rentals WHERE id = $1', [rentalId])
        return res.sendStatus(200)
    }
    catch {
        return res.sendStatus(500)
    }
})

app.listen(4000);