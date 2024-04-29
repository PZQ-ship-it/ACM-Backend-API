const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

app.use(express.json());

const uri = "mongodb+srv://3210102495:Gw7GaKXlOuMWQ1bf@cluster0.pheotiv.mongodb.net/test";
const client = new MongoClient(uri);

app.post('/changeClass', async (req, res) => {
    const { teacher_id, class_id, schedule_id, time_slot, min_capacity, min_equip } = req.body;

    try {
        await client.connect();

        const database = client.db('scheduling_course');
        const schedulingCollection = database.collection('schedule_res');
        const classCollection = database.collection('classrooms');

        // 检查教师是否在该时间段有其他课程
        const teacherSchedule = await schedulingCollection.findOne({ schedule_id: schedule_id, time: { $ne: time_slot } });
        if (teacherSchedule) {
            res.json({ success: false });  // 教师时间冲突
            return;
        }

        // 查找满足条件的教室
        const availableClasses = await classCollection.find({ 
            capacity: { $gte: min_capacity },
            equipment: { $all: min_equip }
        }).toArray();

        // 检查教室在指定时间段是否被占用
        for (let i = 0; i < availableClasses.length; i++) {
            const classSchedule = await schedulingCollection.findOne({ classroom: availableClasses[i].classroom_id, time: time_slot });
            if (classSchedule) {
                availableClasses.splice(i, 1);
                i--;
            }
        }

        if (availableClasses.length === 0) {
            res.json({ success: false });  // 没有合适的教室
            return;
        } else {
            res.json({ success: true, classes: availableClasses });  // 显示可切换的教室
            return;
        }
    } catch (err) {
        console.error('An error occurred while trying to connect to MongoDB', err);
        res.status(500).json({ message: 'An error occurred while trying to connect to MongoDB' });
    } finally {
        await client.close();
    }
});

app.listen(3000, () => console.log('Server is running on port 3000'));