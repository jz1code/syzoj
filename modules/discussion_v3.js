let Problem = syzoj.model('problem');
let Article = syzoj.model('article');
let ArticleComment = syzoj.model('article-comment');
let User = syzoj.model('user');

app.get('/api/v3/discussions/global', async(req, res) => {
  try {
    let where = {problem_id: null}
    let paginate = syzoj.utils.paginate(await Article.countForPagination(where), req.query.page, syzoj.config.page.discussion);
    let articles = await Article.queryPage(paginate, where, {
      sort_time: 'DESC'
    });

    for (let article of articles) {
      await article.loadRelationships()
      article.user = {
        username: article.user.username,
        nickname: article.user.nickname
      }
    }
    res.send({success: true, data: articles})
  } catch(e) {

  }
})

app.get('/api/v3/discussions/problems', async(req, res) => {
  try {
    let where = {problem_id: TypeORM.Not(TypeORM.IsNull())};
    let paginate = syzoj.utils.paginate(await Article.countForPagination(where), req.query.page, syzoj.config.page.discussion);
    let articles = await Article.queryPage(paginate, where, {
      sort_time: 'DESC'
    });


    for (let article of articles) {
      await article.loadRelationships()
      article.user = {
        username: article.user.username,
        nickname: article.user.nickname
      }
      let problem = await Problem.findById(article.problem_id);
      article.problem = {
        title: problem.title
      }
    }

    res.send({success: true, data: articles})

  } catch(e) {

  }
})

app.get('/api/v3/discussion/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let article = await Article.findById(id);
    if (!article) throw new ErrorMessage('无此帖子。');

    await article.loadRelationships();
    article.user = {
      username: article.user.username,
      nickname: article.user.nickname
    }
    // article.allowedEdit = await article.isAllowedEditBy(res.locals.user);
    // article.allowedComment = await article.isAllowedCommentBy(res.locals.user);
    // article.content = await syzoj.utils.markdown(article.content);

    res.send({success: true, data: article})
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});


app.get('/api/v3/discussion/:id/comments', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let where = { article_id: id };
    let commentsCount = await ArticleComment.countForPagination(where);
    let paginate = syzoj.utils.paginate(commentsCount, req.query.page, syzoj.config.page.article_comment);

    let comments = await ArticleComment.queryPage(paginate, where, {
      public_time: 'DESC'
    });

    for (let comment of comments) {
      comment.user = await User.findById(comment.user_id);
      comment.user = {
        username: comment.user.username,
        nickname: comment.user.nickname
      }
      // comment.content = await syzoj.utils.markdown(comment.content);
      // comment.allowedEdit = await comment.isAllowedEditBy(res.locals.user);
      // await comment.loadRelationships();
    }

    // let problem = null;
    // if (article.problem_id) {
    //   problem = await Problem.findById(article.problem_id);
    //   if (!await problem.isAllowedUseBy(res.locals.user)) {
    //     throw new ErrorMessage('您没有权限进行此操作。');
    //   }
    // }

    res.send({success: false, data: comments})
  } catch(e) {

  }
})

app.get('/article/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let article = await Article.findById(id);

    if (!article) {
      article = await Article.create();
      article.id = 0;
      article.allowedEdit = true;
    } else {
      article.allowedEdit = await article.isAllowedEditBy(res.locals.user);
    }

    res.render('article_edit', {
      article: article
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/article/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let article = await Article.findById(id);

    let time = syzoj.utils.getCurrentDate();
    if (!article) {
      article = await Article.create();
      article.user_id = res.locals.user.id;
      article.public_time = article.sort_time = time;

      if (req.query.problem_id) {
        let problem = await Problem.findById(req.query.problem_id);
        if (!problem) throw new ErrorMessage('无此题目。');
        article.problem_id = problem.id;
      } else {
        article.problem_id = null;
      }
    } else {
      if (!await article.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    if (!req.body.title.trim()) throw new ErrorMessage('标题不能为空。');
    article.title = req.body.title;
    article.content = req.body.content;
    article.update_time = time;
    article.is_notice = (res.locals.user && res.locals.user.is_admin ? req.body.is_notice === 'on' : article.is_notice);

    await article.save();

    res.redirect(syzoj.utils.makeUrl(['article', article.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/article/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let article = await Article.findById(id);

    if (!article) {
      throw new ErrorMessage('无此帖子。');
    } else {
      if (!await article.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    await Promise.all((await ArticleComment.find({
      article_id: article.id
    })).map(comment => comment.destroy()))

    await article.destroy();

    res.redirect(syzoj.utils.makeUrl(['discussion', 'global']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/article/:id/comment', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let article = await Article.findById(id);

    if (!article) {
      throw new ErrorMessage('无此帖子。');
    } else {
      if (!await article.isAllowedCommentBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    let comment = await ArticleComment.create({
      content: req.body.comment,
      article_id: id,
      user_id: res.locals.user.id,
      public_time: syzoj.utils.getCurrentDate()
    });

    await comment.save();

    await article.resetReplyCountAndTime();

    res.redirect(syzoj.utils.makeUrl(['article', article.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/article/:article_id/comment/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let comment = await ArticleComment.findById(id);

    if (!comment) {
      throw new ErrorMessage('无此评论。');
    } else {
      if (!await comment.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    const article = await Article.findById(comment.article_id);

    await comment.destroy();

    await article.resetReplyCountAndTime();

    res.redirect(syzoj.utils.makeUrl(['article', comment.article_id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});