import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";

import path from "node:path";

export type TLesson = {
  path: string;
  name: string;
  done: boolean;
  subtitles: string;
  duration: number;
};

export type TSection = {
  name: string;
  lessons: TLesson[];
};
export type TConfig = {
  courseName: string;
  lastLesson?: TLesson;
  sections: TSection[];
};

export class Config {
  basePath: string;
  config?: TConfig;
  protected parsedDir?: TSection[];

  constructor(basePath: string) {
    this.basePath = basePath;
    if (!this.checkForConfig()) {
      this.parsedDir = this.parseDir();
      this.config = {
        courseName: path.basename(this.basePath),
        sections: this.parsedDir,
      };
      this.createConfigJson();
    }
  }

  checkForConfig() {
    return existsSync(path.resolve(this.basePath, "config.json"));
  }

  parseDir() {
    const coursePath = readdirSync(this.basePath);
    const sections: TSection[] = [];

    for (const file of coursePath) {
      const sectionPath = path.resolve(this.basePath, file);
      const isDir = statSync(sectionPath).isDirectory();

      if (isDir) {
        const sectionDir = readdirSync(sectionPath, { withFileTypes: true });
        const subtitles = sectionDir.filter((file) =>
          ["srt", "vtt"].includes(file.name.split(".")[1])
        );
        const lessons = sectionDir
          .filter((file) =>
            ["mp4", "avi", "mkv"].includes(file.name.split(".")[1])
          )
          .map((file) => {
            const fileBuffer = readFileSync(
              path.resolve(file.parentPath, file.name)
            );
            const duration = this.getMp4Duration(fileBuffer);
            const subs = subtitles.find((sub) =>
              sub.name.split(".")[0].includes(file.name.split(".")[0])
            );

            return {
              name: file.name,
              path: file.parentPath,
              duration: Math.round(duration),
              subtitles: subs ? path.resolve(subs?.parentPath, subs.name) : "",
              done: false,
            };
          });

        sections.push({ name: file, lessons });
      }
    }

    return sections;
  }

  createConfigJson() {
    writeFileSync(
      path.resolve(this.basePath, "config.json"),
      JSON.stringify(this.config)
    );
  }

  public static saveConfigJson(config: TConfig, basePath: string) {
    writeFileSync(
      path.resolve(basePath, "config.json"),
      JSON.stringify(config)
    );
  }

  getMp4Duration(buffer: NonSharedBuffer) {
    const startIndex =
      buffer.indexOf(Buffer.from(Buffer.from("mvhd").toString("hex"), "hex")) +
      4;

    const version = Buffer.from(
      buffer.buffer.slice(startIndex, startIndex + 1)
    ).readIntBE(0, 1);

    if (version === 0) {
      const duration = Buffer.from(
        buffer.buffer.slice(startIndex + 16, startIndex + 20)
      ).readInt32BE();
      const timeScale = Buffer.from(
        buffer.buffer.slice(startIndex + 12, startIndex + 16)
      ).readInt32BE();
      return duration / timeScale;
    } else {
      // const duration = Buffer.from(
      //   buffer.buffer.slice(startIndex + 20, startIndex + 24)
      // ).readBigInt64BE();
      // const timeScale = Buffer.from(
      //   buffer.buffer.slice(startIndex + 16, startIndex + 20)
      // ).readBigInt64BE();
      // return Number(duration / timeScale);
    }
  }
}
