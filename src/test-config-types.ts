import 'reflect-metadata';
import { Type } from 'class-transformer';
import { IsInt, IsString, IsBoolean, ValidateNested } from 'class-validator';

export class AppConfig {
    @IsInt()
    port: number;
}

export class DbConfig {
    @IsString()
    host: string;

    @IsString()
    name: string;

    @IsString()
    user: string;

    @IsString()
    password: string;

    @IsInt()
    port: number;
}

export class LoggingConfig {
    @IsBoolean()
    logDbQuereis: boolean;
}

export class Config {
    @ValidateNested()
    @Type(() => AppConfig)
    app: AppConfig;

    @ValidateNested()
    @Type(() => DbConfig)
    db: DbConfig;

    @ValidateNested()
    @Type(() => LoggingConfig)
    logging: LoggingConfig;
}
