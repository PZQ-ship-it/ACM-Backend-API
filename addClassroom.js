const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
app.use(express.json());

const uri = "mongodb+srv://3210102495:Gw7GaKXlOuMWQ1bf@cluster0.pheotiv.mongodb.net/test";
const client = new MongoClient(uri);

app.post('/addClassroom', async (req, res) => {
    try {
        await client.connect();

        const database = client.db('scheduling_course');
        const classroomsCollection = database.collection('classrooms');
        const campusCollection = database.collection('campus');

        // 从请求体中获取教室信息
        let classroomInfo = req.body;

        // 查询 campus_id
        const campus = await campusCollection.findOne({ name: classroomInfo.campus });
        if (!campus) {
            throw new Error('Campus not found');
        }
        const campus_id = campus.campus_id;

        // 调整数据格式
        classroomInfo = {
            classroom_id: classroomInfo.classroom_id,
            classroom_name: classroomInfo.classroom_name,
            campus_id: campus_id,
            capacity: classroomInfo.capacity,
            equipment: classroomInfo.equipment,
        };

        // 检查是否已经存在具有相同 classroom_name 和 campus_id 的教室
        const existingClassroom = await classroomsCollection.findOne({ classroom_name: classroomInfo.classroom_name, campus_id: campus_id });
        if (existingClassroom) {
            // 如果 classroom_name 和 campus_id 都相同，拒绝插入新的教室
            res.status(400).json({ message: 'Classroom with the same name and campus already exists. Insertion is denied.' });
        } else {
            // 插入新的教室
            const result = await classroomsCollection.insertOne(classroomInfo);
            res.status(201).json({ message: `Successfully inserted item with _id: ${result.insertedId}` });
        }
    } catch (err) {
        console.error('An error occurred while trying to connect to MongoDB', err);
        res.status(500).json({ message: 'An error occurred while trying to connect to MongoDB' });
    } finally {
        await client.close();
    }
});

app.listen(3000, () => console.log('Server is running on port 3000'));