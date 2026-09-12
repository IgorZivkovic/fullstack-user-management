<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['screening', 'technical', 'hr', 'final']);
            $table->dateTime('scheduled_at');
            $table->string('contact_name', 160)->nullable();
            $table->string('contact_email', 160)->nullable();
            $table->string('location_or_link', 2048)->nullable();
            $table->text('notes')->nullable();
            $table->enum('outcome', ['passed', 'failed', 'cancelled'])->nullable();
            $table->timestamps();

            $table->index(['job_application_id', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
