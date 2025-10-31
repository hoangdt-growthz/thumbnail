import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('images')
export class ImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  folder: string;

  @Column()
  filename: string;

  @Column({ unique: true })
  url: string;

  @CreateDateColumn()
  createdAt: Date;
}
