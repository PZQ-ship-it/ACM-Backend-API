const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();

const uri = "mongodb+srv://3210102495:Gw7GaKXlOuMWQ1bf@cluster0.pheotiv.mongodb.net/test";
const client = new MongoClient(uri);

app.get('/getCourses/:teacher_id', async (req, res) => {
    try {
        await client.connect();

        const database = client.db('scheduling_course');
        const schedulingCollection = database.collection('schedule_res');
        const courseCollection = database.collection('courses');
        const classCollection = database.collection('classrooms');
        const campusCollection = database.collection('campus');
        const teacherCollection = database.collection('teacher');

        const courses = await schedulingCollection.find({ teacher: parseInt(req.params.teacher_id) }).toArray();
        const courseTimes = [];

        for (let i = 0; i < courses.length; i++) {
            const course = await courseCollection.findOne({ class_id: courses[i].class_id });
            const classroom = await classCollection.findOne({ classroom_id: courses[i].classroom_id });
            const campus = await campusCollection.findOne({ campus_id: course.campus_id });
            const teacher = await teacherCollection.findOne({ teacher_id: courses[i].teacher_id });

            if (!teacher) {
                continue;
            }

            if (courseTimes.includes(courses[i].time)) {
                throw new Error('Time conflict detected!');
            } else {
                courseTimes.push(courses[i].time);
            }

            courses[i].class_name = course.class_name;
            courses[i].classroom_name = classroom.classroom_name;
            courses[i].campus_name = campus.name;
            courses[i].teacher_name = teacher.teacher_name;
            courses[i].capacity = classroom.capacity;
        }

        res.json(courses);  // 返回结果到前端
    } catch (err) {
        console.error('An error occurred while trying to connect to MongoDB', err);
        res.status(500).json({ message: 'An error occurred while trying to connect to MongoDB' });
    } finally {
        await client.close();
    }
});

app.listen(3000, () => console.log('Server is running on port 3000'));