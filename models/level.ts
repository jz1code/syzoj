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


@TypeORM.Entity()
export default class Level extends Model {
  static cache = true

  @TypeORM.PrimaryGeneratedColumn()
  id: number

  @TypeORM.Column({default:"", type: "varchar", length: 80 })
  title: string

  @TypeORM.Column({default:"", type: "varchar", length: 80 })
  description: string

  @TypeORM.Column({default:"", type: "varchar", length: 80 })
  icon: string

}