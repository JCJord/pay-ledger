import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'securepassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
