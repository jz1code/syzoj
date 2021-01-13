let ProblemExt = syzoj.model('problem_ext');
let Problem = syzoj.model('problem');
let User = syzoj.model('user');
let JudgeState = syzoj.model('judge_state');

var levelIds=[101, 102, 103, 104, 105, 106, 107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123, 
    201, 202, 203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
    301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,321,
    401,402,403,404,405,406,407,408,409]
app.post('/level/:id?', async (req, res) => {
    try {
        if(res.locals.user) {
            // 得到当前level_id
            user = await User.findById(res.locals.user.id)
            var level_id = user.level_id
            // TODO: 检查题目是否全部完成, 全部完成
            var completed = 0
            let problems = await ProblemExt.findByLevelId(user.level_id)
            await problems.mapAsync(async problem => {
                problem = await Problem.findById(problem.problem_id);
                problem.judge_state = await problem.getJudgeState(res.locals.user, true);
                if (problem.judge_state && problem.judge_state.status == "Accepted") completed += 1
                return problem;
            })
            let total = problems.length
    

            // 升级
            let current_level_id_index = levelIds.indexOf(level_id)
            current_level_id_index += 1
            if(current_level_id_index >= levelIds.length) current_level_id_index--
            user.level_id = levelIds[current_level_id_index]
            await user.save()
        } 

        res.redirect('/level')
    } catch(ex) {

    }
})


app.get('/level/:id?', async (req, res) => {
    try {
        
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        user = await User.findById(res.locals.user.id)
        // if(user) throw new ErrorMessage('该功能即将开放');
        var level_id = user.level_id
        level_id = isNaN(req.params.id) ? level_id : parseInt(req.params.id)
        if(level_id > user.level_id) level_id=user.level_id;
        

        // 用户当前级别的题目
        var completed = 0
        var allCompleted = 0;
        var total = 0;
        let problems = await ProblemExt.findByLevelId(user.level_id)
        await problems.mapAsync(async pe => {
            let problem = await Problem.findById(pe.problem_id);            
            problem.judge_state = await problem.getJudgeState(res.locals.user, true);

            if (problem.judge_state && problem.judge_state.status == "Accepted") {
                allCompleted += 1
                if(pe.is_extra == 0) completed += 1
            }

            if(pe.is_extra == 0) total += 1;
            return problem;
        })

        // 选择级别的题目
        problems = await ProblemExt.findByLevelId(level_id)
        problems = await problems.mapAsync(async pe => {
            let problem = await Problem.findById(pe.problem_id);
            if(pe.is_extra == 1) problem.title = "【附加题】" + problem.title
            else problem.title = "【必修题】" + problem.title
            // syzoj.log(pe.problem_id + "   " +problem.title)
            problem.judge_state = await problem.getJudgeState(res.locals.user, true);
            return problem;
        })

        res.render('level.ejs', {
            problems: problems,
            total: total,
            completed: completed,
            allCompleted: allCompleted,
            levelIds: levelIds
        })

    } catch (ex) {
        syzoj.log(ex)
        console.writeln(ex)
        res.render('error', {
          err: ex
        })
    }
})