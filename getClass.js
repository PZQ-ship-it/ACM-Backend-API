const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

const uri = "mongodb+srv://3210102495:Gw7GaKXlOuMWQ1bf@cluster0.pheotiv.mongodb.net/test";
const client = new MongoClient(uri);

app.get('/getClasses', async (req, res) => {
    try {
        await client.connect();

        const database = client.db('scheduling_course');
        const classCollection = database.collection('classrooms');

        // 获取所有教室信息
        const classes = await classCollection.find({}).toArray();

        // 将设备数组转换为字符串
        for (let i = 0; i < classes.length; i++) {
            classes[i].equipment = classes[i].equipment.join(', ');
        }

        res.json(classes);  // 返回结果到前端
    } catch (err) {
        console.error('An error occurred while trying to connect to MongoDB', err);
        res.status(500).json({ message: 'An error occurred while trying to connect to MongoDB' });
    } finally {
        await client.close();
    }
});

app.listen(3000, () => console.log('Server is running on port 3000'));