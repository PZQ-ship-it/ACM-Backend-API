app.post('/changeSchedule', async (req, res) => {
    const { teacher_id, course_id, schedule_id, time_slot, classroom_id } = req.body;

    try {
        await client.connect();

        const database = client.db('scheduling_course');
        const schedulingCollection = database.collection('schedule_res');

        // 检查教师在该时间段是否有其他课程
        const teacherSchedule = await schedulingCollection.findOne({ teacher_id: teacher_id, time: { $ne: time_slot } });
        if (teacherSchedule) {
            res.json({ success: false });  // 教师时间冲突
            return;
        }

        // 检查教室在该时间段是否被占用
        const classSchedule = await schedulingCollection.findOne({ classroom_id: classroom_id, time: time_slot });
        if (classSchedule) {
            res.json({ success: false });  // 教室时间冲突
            return;
        }

        // 更新排课表
        const result = await schedulingCollection.updateOne(
            { schedule_id: schedule_id },
            {
                $set: {
                    teacher_id: teacher_id,
                    course_id: course_id,
                    time: time_slot,
                    classroom_id: classroom_id
                }
            }
        );

        if (result.modifiedCount === 1) {
            res.json({ success: true, schedule: await schedulingCollection.findOne({ schedule_id: schedule_id }) });  // 返回修改后的排课表项
        } else {
            res.json({ success: false });  // 更新失败
        }
    } catch (err) {
        console.error('An error occurred while trying to connect to MongoDB', err);
        res.status(500).json({ message: 'An error occurred while trying to connect to MongoDB' });
    } finally {
        await client.close();
    }
});