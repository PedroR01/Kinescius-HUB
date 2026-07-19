import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Post,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';

import { LibroQuejasService } from './libroQuejas.service';
import { CreateQuejaDto } from './dto/crear-queja.dto';
import { EditarQuejaDto } from './dto/editar-queja.dto';
import { RecordatoriosService } from '../notifications/shifts-reminders.service';


@Controller('libro-quejas')
export class LibroQuejasController {


  constructor(
    private readonly libroQuejasService: LibroQuejasService,
    private readonly recordatoriosService: RecordatoriosService,
  ) {}



  // CLIENTE CREA COMENTARIO
  @Post()
  async registrarComentario(
    @Body() dto: CreateQuejaDto,
    @Headers('authorization') authHeader:string,
  ){

    const usuario =
      await this.resolverUsuarioDesdeToken(authHeader);



    if(usuario.id !== dto.id_cliente){

      throw new ForbiddenException(
        'No podés comentar en nombre de otro cliente'
      );

    }



    return this.libroQuejasService.registrarComentario(
      dto.id_cliente,
      dto.id_clase,
      dto,
    );

  }




  // CLIENTE VE HISTORIAL
  @Get('cliente/:id/historial')
  async obtenerHistorial(
    @Param('id') id:string,
    @Headers('authorization') authHeader:string,
  ){

    const clienteId = Number(id);


    if(Number.isNaN(clienteId)){

      throw new BadRequestException(
        'ID inválido'
      );

    }



    const usuario =
      await this.resolverUsuarioDesdeToken(authHeader);



    if(usuario.id !== clienteId){

      throw new ForbiddenException(
        'No podés ver otro historial'
      );

    }



    return this.libroQuejasService.obtenerHistorial(
      clienteId
    );

  }




  // CLIENTE EDITA SU PROPIO COMENTARIO
  @Patch('cliente/:idCliente/clase/:idClase/comentario')
  async editarComentario(
    @Param('idCliente') idCliente: string,
    @Param('idClase') idClase: string,
    @Body() dto: EditarQuejaDto,
    @Headers('authorization') authHeader: string,
  ) {

    const clienteId = Number(idCliente);
    const claseId = Number(idClase);

    if (Number.isNaN(clienteId) || Number.isNaN(claseId)) {
      throw new BadRequestException('ID inválido');
    }

    const usuario =
      await this.resolverUsuarioDesdeToken(authHeader);

    if (usuario.id !== clienteId) {
      throw new ForbiddenException(
        'No podés editar el comentario de otro cliente',
      );
    }

    return this.libroQuejasService.editarComentario(
      clienteId,
      claseId,
      dto,
    );

  }




  // CLIENTE ELIMINA SU PROPIO COMENTARIO
  @Delete('cliente/:idCliente/clase/:idClase/comentario')
  async eliminarComentario(
    @Param('idCliente') idCliente: string,
    @Param('idClase') idClase: string,
    @Headers('authorization') authHeader: string,
  ) {

    const clienteId = Number(idCliente);
    const claseId = Number(idClase);

    if (Number.isNaN(clienteId) || Number.isNaN(claseId)) {
      throw new BadRequestException('ID inválido');
    }

    const usuario =
      await this.resolverUsuarioDesdeToken(authHeader);

    if (usuario.id !== clienteId) {
      throw new ForbiddenException(
        'No podés eliminar el comentario de otro cliente',
      );
    }

    return this.libroQuejasService.eliminarComentario(
      clienteId,
      claseId,
    );

  }




  // ADMIN VE TODAS LAS QUEJAS (sin auth, igual que ListaEsperaController)
  @Get('admin/comentarios')
  async obtenerTodosLosComentarios(){

    return this.libroQuejasService.obtenerTodosLosComentariosSinAuth();

  }





  private async resolverUsuarioDesdeToken(
    authHeader:string,
  ){


    if(!authHeader){

      throw new UnauthorizedException(
        'Token no enviado'
      );

    }



    const token =
      authHeader.split(' ')[1];



    if(!token){

      throw new UnauthorizedException(
        'Token inválido'
      );

    }



    return this.recordatoriosService.obtenerIdDeUsuario(
      token
    );

  }

}