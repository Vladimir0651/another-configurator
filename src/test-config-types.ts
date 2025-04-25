import 'reflect-metadata';
import { Type, Expose } from 'class-transformer';
import { IsInt, IsString, IsBoolean, ValidateNested, Min, Max } from 'class-validator';

export class AppConfig {
    @Expose()
    @IsInt()
    @Min(0)
    @Max(65535)
    port: number;
}

export class DbConfig {
    @Expose()
    @IsString()
    host: string;

    @Expose()
    @IsString()
    name: string;

    @Expose()
    @IsString()
    user: string;

    @Expose()
    @IsString()
    password: string;

    @Expose()
    @IsInt()
    port: number;
}

export class LoggingConfig {
    @Expose()
    @IsBoolean()
    logDbQuereis: boolean;
}

export class Config {
    @Expose()
    @ValidateNested()
    @Type(() => AppConfig)
    app: AppConfig;

    @Expose()
    @ValidateNested()
    @Type(() => DbConfig)
    db: DbConfig;

    @Expose()
    @ValidateNested()
    @Type(() => LoggingConfig)
    logging: LoggingConfig;
}
