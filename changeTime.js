const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

app.use(express.json());

const uri = "mongodb+srv://3210102495:Gw7GaKXlOuMWQ1bf@cluster0.pheotiv.mongodb.net/test";
const client = new MongoClient(uri);

app.post('/switchClass', async (req, res) => {
    const { teacher_id, schedule_id, course_id, classroom_id, time_slot } = req.body;
    try {
        await client.connect();

        const database = client.db('scheduling_course');
        const schedulingCollection = database.collection('schedule_res');
        const classroomCollection = database.collection('classrooms');

        // 检查教师是否在该时间段有其他课程
        const teacherSchedule = await schedulingCollection.findOne({ teacher_id: teacher_id, time: { $ne: time_slot } });
        if (teacherSchedule) {
            res.json({ success: 0 });  // 教师时间冲突
            return;
        }

        // 检查该时间段的教室是否空闲
        const classSchedule = await schedulingCollection.findOne({ classroom_id: classroom_id, time: time_slot });
        if (classSchedule) {
            // 教室繁忙，查找该教室的所有可用时间
            const allSchedules = await schedulingCollection.find({ classroom_id: classroom_id }).toArray();
            const allTimes = ['Monday 8:00-9:30', 'Monday 10:00-11:30', 'Monday 14:00-15:30', 'Monday 16:00-17:30', 'Tuesday 8:00-9:30', 'Tuesday 10:00-11:30', 'Tuesday 14:00-15:30', 'Tuesday 16:00-17:30', 'Wednesday 8:00-9:30', 'Wednesday 10:00-11:30', 'Wednesday 14:00-15:30', 'Wednesday 16:00-17:30', 'Thursday 8:00-9:30', 'Thursday 10:00-11:30', 'Thursday 14:00-15:30', 'Thursday 16:00-17:30', 'Friday 8:00-9:30', 'Friday 10:00-11:30', 'Friday 14:00-15:30', 'Friday 16:00-17:30'];
            const timeMap = allTimes.reduce((map, time, index) => ({ ...map, [time]: index + 1 }), {});
            const usedTimes = allSchedules.map(s => s.time);
            const availableTimes = allTimes.filter(t => !usedTimes.includes(t)).map(t => timeMap[t]);

            // 获取教室的详细信息
            const classroom = await classroomCollection.findOne({ classroom_id: classroom_id });

            res.json({ success: 2, time: availableTimes, class: [{ class_id: classroom_id, capacity: classroom.capacity, equipment: classroom.equipment, name: classroom.name }] });  // 显示可切换的时间和教室信息
            return;
        } else {
            res.json({ success: -1 });  // 查询失败
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