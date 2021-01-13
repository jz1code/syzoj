import * as TypeORM from "typeorm";
import Model from "./common";

declare var syzoj, ErrorMessage: any;

import User from "./user";
import File from "./file";
import JudgeState from "./judge_state";
import Contest from "./contest";
import ProblemTag from "./problem_tag";
import ProblemTagMap from "./problem_tag_map";
import SubmissionStatistics, { StatisticsType } from "./submission_statistics";

import * as fs from "fs-extra";
import * as path from "path";
import * as util from "util";
import * as LRUCache from "lru-cache";
import * as DeepCopy from "deepcopy";

/**
 * 题库的扩展
 */
@TypeORM.Entity()
export default class ProblemExt extends Model {
  static cache = true

  // @TypeORM.PrimaryGeneratedColumn()
  // id: number

  @TypeORM.Index()
  @TypeORM.PrimaryColumn({type: "integer" })
  // @TypeORM.Column({type: "integer" })
  problem_id: number

  @TypeORM.Column({default: "0", type: "integer" })
  level_id: number

  @TypeORM.Column({default: "0", type: "boolean" })
  is_extra: boolean

  // @TypeORM.Column({default: "0", type: "integer" })
  // level_id: number

  static async findByLevelId(levelId) {
    return await ProblemExt.find({
      where: {
        level_id: levelId
      },
      order: {
        is_extra: 'ASC',
        problem_id: 'ASC'
      }
    });
  }

  
  static async findByProblemId(id) {
    return await ProblemExt.findOne({
      where: {
        problem_id: id
      }
    });
  }
}